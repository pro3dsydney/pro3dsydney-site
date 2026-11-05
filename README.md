# Ultimate3D Sydney — website

Astro static site: fast, multi-page and SEO-friendly. It talks to the API in `pro3dsydney-backend`.

```bash
npm install
npm run build        # → dist/
```

To try everything end to end (uploads, instant quote, checkout, admin), follow **“Run the full prototype locally”** in the backend README. The API serves this site's `dist/` on one port.

For design work only: `npm run dev` (http://localhost:4321). `/api` calls are proxied to a local API on :8787.

## Where things live

| What | File |
|---|---|
| Business name, phone, suburb, Google profile links | `src/config.ts` |
| Real Google reviews to show on the site | `src/data/reviews.ts` |
| FAQ (also feeds FAQ rich results + llms.txt) | `src/data/faq.ts` |
| Colours, fonts, all styling | `src/styles/global.css` |
| Pages | `src/pages/*.astro` |
| Request form logic | `src/pages/quote.astro` |
| Instant quote logic / 3D viewer | `src/scripts/pro.ts`, `src/scripts/viewer.ts` |
| Analytics (own + GA4 + Clarity) | `src/scripts/analytics.ts` |

## SEO built in

- Separate pages for 3D design, materials, pricing and FAQ, each with its own title, description and canonical URL.
- `LocalBusiness` structured data on every page matching the Google Business Profile (name, phone, suburb). Plus `FAQPage`, `Service` and breadcrumb data.
- `sitemap-index.xml`, `robots.txt` (AI crawlers allowed) and `llms.txt` (a plain-text summary for ChatGPT, Perplexity and others).
- Open Graph share image, self-hosted fonts, lazy-loaded media, and three.js only loaded on pages that need it.

## Environment

See `.env.example`:

- `SITE_URL` controls canonical URLs. Change it when moving to `ultimate3dprinting.com.au`.
- `PUBLIC_API_URL` points at the API (leave empty if same-origin).
- `PUBLIC_GA_ID` and `PUBLIC_CLARITY_ID` switch on Google Analytics and Microsoft Clarity.
