# Vivek Maswadkar — Personal Portfolio

A static Astro portfolio built around five chapters: Making, Thinking, Becoming, Living, and Connecting.

## Start locally

```bash
cd /Users/admin/learn_python/maswadkarx.github.io
npm install
npm run dev
```

Open [http://localhost:4321/](http://localhost:4321/).

## Production checks

```bash
npm run check
npm run build
npm run check:discoverability
npm run preview
```

Profile-level content lives in `src/data/profile.ts`. Projects, posts, and media use typed Markdown/MDX collections under `src/content/`; entries with `draft: true` are excluded from production routes.

The discoverability check validates canonical metadata, JSON-LD, sitemap coverage and dates, RSS, `llms.txt`, internal links, crawler policy, and real HTTP responses from an Astro preview server. Deployment publishes the static build to GitHub Pages and sends a non-blocking IndexNow notification afterward.

Operational submission and monitoring guidance lives in [`docs/discoverability-operations.md`](docs/discoverability-operations.md).
