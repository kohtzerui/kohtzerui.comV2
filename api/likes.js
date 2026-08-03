import { getStore } from '@netlify/blobs';

const SESSION_COOKIE = 'duck_like_session';
const STORE_NAME = 'duck-article-likes';

function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
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

function articleKey(article) {
  return encodeURIComponent(article);
}

function counterKey(article) {
  return `count:${articleKey(article)}`;
}

function sessionKey(article, sessionId) {
  return `session:${articleKey(article)}:${sessionId}`;
}

function openLikeStore() {
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

function parseCount(value) {
  const count = Number.parseInt(value || '0', 10);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

async function readLikeState(article, sessionId) {
  const store = openLikeStore();
  const [countValue, sessionLike] = await Promise.all([
    store.get(counterKey(article)),
    sessionId ? store.get(sessionKey(article, sessionId)) : null,
  ]);

  return { count: parseCount(countValue), liked: sessionLike !== null };
}

async function addLike(article, sessionId) {
  const store = openLikeStore();
  const likeKey = sessionKey(article, sessionId);
  const existingLike = await store.get(likeKey);
  const accepted = existingLike === null;

  if (!accepted) {
    return {
      accepted: false,
      count: parseCount(await store.get(counterKey(article))),
      liked: true,
    };
  }

  const currentCount = parseCount(await store.get(counterKey(article)));
  const count = currentCount + 1;

  await Promise.all([
    store.set(likeKey, new Date().toISOString()),
    store.set(counterKey(article), String(count)),
  ]);

  return { accepted: true, count, liked: true };
}

export default async function handler(request) {
  const url = new URL(request.url);
  const article = normalizeArticle(url.searchParams.get('article'));

  if (!article) {
    return json({ error: 'A valid blog article path is required.' }, { status: 400 });
  }

  try {
    if (request.method === 'GET') {
      return json(await readLikeState(article, readSessionId(request)));
    }

    if (request.method === 'POST') {
      const existingSessionId = readSessionId(request);
      const sessionId = existingSessionId || crypto.randomUUID();
      const result = await addLike(article, sessionId);
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