import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const SESSION_COOKIE = 'duck_like_session';
const SESSION_DEDUPE_TTL_SECONDS = 60 * 60 * 24 * 30;
const LOCAL_STORE_PATH = join(tmpdir(), 'kohtzerui-duck-likes-local.json');

const LIKE_SCRIPT = `
  local inserted = redis.call('SET', KEYS[1], '1', 'NX', 'EX', ARGV[1])
  if inserted then
    local count = redis.call('INCR', KEYS[2])
    return {1, count}
  end

  local count = redis.call('GET', KEYS[2])
  return {0, tonumber(count) or 0}
`;

function hasRedisConfig() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Like storage is not configured.');
  }

  return { url, token };
}

async function redisRequest(path, command) {
  const { url, token } = getRedisConfig();
  const response = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(payload?.error || 'Redis request failed.');
  }

  return payload;
}

function normalizeArticle(value) {
  if (typeof value !== 'string' || !/^\/blog\/[a-z0-9-]+\/?$/.test(value)) {
    return null;
  }

  return `${value.replace(/\/+$/, '')}/`;
}

function readSessionId(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  if (!cookie) return null;

  const value = decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1));
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

function counterKey(article) {
  return `duck-likes:count:${article}`;
}

function sessionKey(article, sessionId) {
  return `duck-likes:session:${sessionId}:${article}`;
}

async function readLikeState(article, sessionId) {
  const commands = [['GET', counterKey(article)]];

  if (sessionId) {
    commands.push(['EXISTS', sessionKey(article, sessionId)]);
  }

  const results = await redisRequest('/pipeline', commands);
  const count = Number(results[0]?.result || 0);
  const liked = sessionId ? Number(results[1]?.result || 0) === 1 : false;

  return { count, liked };
}

async function addLike(article, sessionId) {
  const payload = await redisRequest('', [
    'EVAL',
    LIKE_SCRIPT,
    2,
    sessionKey(article, sessionId),
    counterKey(article),
    SESSION_DEDUPE_TTL_SECONDS,
  ]);

  const [accepted, count] = payload.result || [0, 0];
  return { accepted: accepted === 1, count: Number(count || 0), liked: true };
}

function shouldUseLocalStore(request) {
  const hostname = new URL(request.url).hostname;
  return !hasRedisConfig() && (hostname === 'localhost' || hostname === '127.0.0.1');
}

async function readLocalStore() {
  try {
    return JSON.parse(await readFile(LOCAL_STORE_PATH, 'utf8'));
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('Could not read the local duck-like store:', error);
    }
    return { counts: {}, sessions: {} };
  }
}

async function writeLocalStore(store) {
  await mkdir(dirname(LOCAL_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

async function readLocalLikeState(article, sessionId) {
  const store = await readLocalStore();
  return {
    count: Number(store.counts[article] || 0),
    liked: sessionId ? store.sessions[sessionKey(article, sessionId)] === true : false,
  };
}

async function addLocalLike(article, sessionId) {
  const store = await readLocalStore();
  const key = sessionKey(article, sessionId);
  const accepted = store.sessions[key] !== true;

  if (accepted) {
    store.sessions[key] = true;
    store.counts[article] = Number(store.counts[article] || 0) + 1;
    await writeLocalStore(store);
  }

  return { accepted, count: Number(store.counts[article] || 0), liked: true };
}

export default async function handler(request) {
  const url = new URL(request.url);
  const article = normalizeArticle(url.searchParams.get('article'));

  if (!article) {
    return json({ error: 'A valid blog article path is required.' }, { status: 400 });
  }

  try {
    const useLocalStore = shouldUseLocalStore(request);

    if (request.method === 'GET') {
      const sessionId = readSessionId(request);
      const state = useLocalStore
        ? await readLocalLikeState(article, sessionId)
        : await readLikeState(article, sessionId);
      return json(state);
    }

    if (request.method === 'POST') {
      const existingSessionId = readSessionId(request);
      const sessionId = existingSessionId || crypto.randomUUID();
      const result = useLocalStore
        ? await addLocalLike(article, sessionId)
        : await addLike(article, sessionId);
      const headers = new Headers();

      if (!existingSessionId) {
        const secure = url.protocol === 'https:' ? '; Secure' : '';
        headers.set(
          'Set-Cookie',
          `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax${secure}`,
        );
      }

      return json(result, { headers });
    }

    return json(
      { error: 'Method not allowed.' },
      { status: 405, headers: { Allow: 'GET, POST' } },
    );
  } catch (error) {
    console.error('Duck like API error:', error);
    return json({ error: 'The like counter is temporarily unavailable.' }, { status: 503 });
  }
}

export const config = {
  path: '/api/likes',
};
