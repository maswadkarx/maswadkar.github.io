# Search and AI discoverability operations

## Public discovery contract

- Canonical origin: `https://resume.maswadkar.com`
- Maximum crawler access: `/robots.txt`
- Sitemap index: `/sitemap-index.xml`
- Canonical page sitemap: `/sitemap-0.xml`
- AI-oriented site guide: `/llms.txt`
- Writing feed: `/rss.xml`
- Stable Person entity: `https://resume.maswadkar.com/#vivek`

Run the complete local gate before publishing:

```bash
npm run build
npm run check:discoverability
```

The gate checks generated files and starts a local preview server to verify discovery endpoints return `200`, unknown routes return `404`, and the custom 404 document carries `noindex,follow`.

## Deployment and notification

GitHub Actions deploys `dist/` from `main`. The deployment must succeed before IndexNow runs. IndexNow sitemap retrieval and URL submission retry transient failures; notification remains non-blocking so a search endpoint outage cannot roll back a healthy site deployment.

Use the dry run when changing sitemap or IndexNow behavior:

```bash
node scripts/submit-indexnow.mjs --dry-run
```

## Search console setup

The intended properties are:

- Google Search Console domain property: `maswadkar.com`
- Google Search Console URL-prefix property: `https://resume.maswadkar.com/`
- Bing Webmaster Tools site: `https://resume.maswadkar.com/`

Submit `https://resume.maswadkar.com/sitemap-index.xml` to both services after a successful production deployment. Request inspection/indexing for the homepage, About, Resume, Krishi AI, the newest article, and Media archive. Search engines decide whether and when to crawl or index a URL; submission is a discovery signal, not a guarantee.

## Monitoring cadence

Review weekly for the first four weeks after this release, then monthly.

Record:

- indexed and excluded URL counts;
- crawl errors and selected canonicals;
- impressions, clicks, and emerging queries;
- structured-data warnings or errors;
- sitemap and IndexNow outcomes;
- Bing AI Performance citations when available.

Run this citation benchmark in ChatGPT, Gemini, Claude, Perplexity, and Copilot and record the answer, cited URL, and date:

1. Who is Vivek Maswadkar?
2. Vivek Maswadkar AI/ML engineer
3. Who built Krishi AI?
4. Vivek Maswadkar agentic AI projects
5. Vivek Maswadkar writing on AI-assisted coding

## Content and privacy guardrails

- Change `updatedAt` only when the page content substantively changes.
- Keep structured data identical to visible claims.
- Do not publish private addresses, phone numbers, credentials, confidential employer material, unpublished work, synthetic achievements, or unverified outcomes.
- Keep public identity and the canonical portfolio URL aligned across owned profiles.
- Respond to abusive traffic with rate limiting or a CDN/WAF rule, not broad crawler blocks.
