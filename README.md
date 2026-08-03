# kohtzerui.com

An Astro portfolio with a Markdown/MDX-powered Cornell-notes blog.

## Write or edit a blog post

Posts live in `src/content/blog/`. Open `ai-inference.mdx` to edit the current article—there is no generated HTML to touch.

For a new post:

1. Copy `_template.mdx` and rename it, for example `gpu-memory.mdx`.
2. Change the frontmatter at the top: title, date, tags, summary, and references.
3. Set `draft: false` when it is ready to appear.
4. Write normal Markdown between the reusable `<CornellSection>` blocks.

Markdown basics:

- A blank line starts a new paragraph.
- `## Heading` creates a section heading.
- `- item` creates a bullet list.
- `**text**` makes text bold.
- `![description](/images/file.png)` adds an image inside the notes.
- `cueImage="/images/file.png"` places an image in the left cue column.
- Add images to `public/images/`.

The blog index is generated automatically. The newest `publishedAt` date becomes the featured card; older posts follow below it.

## Local preview

Install the dependencies and start Astro:

```powershell
npm install
npm run dev
```

Open `http://localhost:4173`.

Netlify's Vite plugin runs the like-counter function at `/api/likes` during normal Astro development. When Redis credentials are absent, local likes are stored in the operating system's temporary directory.

## Production

```powershell
npm run build
```

`netlify.toml` configures Netlify to publish `dist/` and deploy functions from `api/`.

## Article like counter

The duck button uses `api/likes.js` and Upstash Redis to keep a shared count for each article. A session-only, HTTP-only cookie prevents the same browser session from incrementing an article more than once.

1. Create an Upstash Redis database.
2. Add these variables in Netlify under Project configuration > Environment variables, with access to Functions:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

3. Redeploy the site after setting the variables.

To test against the real Redis database locally, copy `.env.example` to `.env`, fill in the values, and run `npm run dev`. Use the standard REST token only as a server-side environment variable; never expose it in browser code.
