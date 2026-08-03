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

Netlify's Vite plugin runs the like-counter function and a sandboxed local Blob store during normal Astro development. Local counter data is separate from production data.

## Production

```powershell
npm run build
```

`netlify.toml` configures Netlify to publish `dist/` and deploy functions from `api/`.

## Article like counter

The duck button uses `api/likes.js` and Netlify Blobs to keep a shared count for each article. Netlify provisions the production store automatically, so no database credentials are required. A session-only, HTTP-only cookie prevents the same browser session from incrementing an article more than once.
