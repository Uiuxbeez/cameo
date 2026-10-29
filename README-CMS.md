# Cameo React website and page builder

The React app preserves the current Cameo HTML/CSS design. The existing root HTML files remain as source references. The live React site reads **published content from PostgreSQL**, not those HTML files. The CMS edits section content while keeping its original markup and classes.

## Run locally

```powershell
npm ci
npm run dev
```

- Website: http://127.0.0.1:5173/
- Builder: http://127.0.0.1:5173/admin/page-builder
- Administrator: `admin@cameoadv.com`
- Initial password: the `ADMIN_PASSWORD` value in the ignored local `.env`. Use Account in the builder to change it. Changing it in the database does not rewrite `.env`.

The supplied database has already been migrated and seeded. The credential is only in the ignored server `.env`; it is not bundled into React. Keep `.env` out of Git and out of Cloudflare frontend build variables.

## Builder

- All 13 pages: Home, About, Services, six service detail pages, Projects, Jotun project detail, Clients, Contact.
- Select a page, then a section. Content edits text, images, image descriptions, links, and per-link new-tab behavior. Search finds a field by its content.
- Items duplicates or removes repeating cards/logos/list entries. Settings renames, hides, duplicates, or removes a section. Drag sections or use arrow controls to reorder.
- Add content sections or create a new draft page from an existing page layout. New pages need a navigation link added after publishing.
- Header and footer are editable for each page. They are **not synchronized across pages**.
- Preview shows the current unsaved draft, including mobile mode. Preview links and enquiry submission do not navigate/send.
- Save Draft persists without changing the live page. Publish saves first and then makes that version public. Concurrent edits are rejected with a reload message instead of silently overwriting someone else's work.
- Uploads support PNG, JPEG, WebP, GIF, and AVIF up to 8 MB. Uploaded image bytes are stored in PostgreSQL so Railway restarts do not lose them. This is suitable for a small CMS; use object storage for a large media library/video uploads. Existing videos remain in the static assets.
- Enquiries are saved in PostgreSQL and shown in the admin inbox. They do not send email notifications. Existing telephone, email, and WhatsApp links still work.

## Railway API

Deploy this repository as a Node service with the repository root as the service root. `railway.json` sets `npm start` and `/api/health`. Use Node 22 or newer. No frontend build is needed on Railway.

Set these **Railway server variables**:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Your Neon pooled connection string |
| `NODE_ENV` | `production` |
| `FRONTEND_ORIGIN` | Exact Cloudflare frontend origin, e.g. `https://cameo.pages.dev`; comma-separated explicit origins if needed |

Railway supplies `PORT`. The database is already initialized; **do not reset it**. For a new empty database, run once from a trusted terminal with its environment set:

```powershell
npm run db:migrate
npm run db:seed
npm run admin:create
```

`admin:create` needs `ADMIN_EMAIL` and `ADMIN_PASSWORD` (14+ characters). It does not overwrite an existing user. `db:seed` inserts missing pages and preserves existing edits. Migrations use the direct endpoint derived from the pooled URL, or `DIRECT_DATABASE_URL` if set. Tables are isolated in `cameo_cms`; migration tracking is in `cameo_cms_migrations`.

For later schema changes, edit `server/schema.js`, run `npm run db:generate`, review the SQL, test against a development database/Neon branch, then run `npm run db:migrate`. The initial migration was tested with an isolated local PostgreSQL engine before application to the empty supplied database. No Neon management credential was supplied, so no Neon branch was created.

## Cloudflare Pages frontend

Use a **Git-connected Pages project** so Cloudflare builds both the frontend and the root `functions/` proxy:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 22 or newer |
| Pages runtime variable `API_ORIGIN` | Railway HTTPS URL, e.g. `https://your-api.up.railway.app` (no `/api` suffix) |

`functions/api/[[path]].js` forwards `/api/*` to Railway. This keeps login cookies same-origin, HttpOnly, Secure in production, and independent of third-party cookie settings. The API checks request origins for writes. Set the real Pages/custom domain in Railway's `FRONTEND_ORIGIN`; arbitrary preview domains are not automatically trusted.

Do not upload only `dist` through the dashboard: that omits the API proxy. For CLI deployments, use `wrangler pages deploy dist` from the repository root so it includes `functions/`.

After configuring both services, check `/api/health`, sign in, save and publish a draft, upload an image, and submit a contact enquiry. Hosting deployment, custom domains, and external chat/maps are not automatically verified by a local build.

## Source and verification

- `web/src/Page.jsx`: React section renderer.
- `web/src/admin/`: builder interface; `fields.js`: content bindings and repeating items.
- `web/src/runtime.js`: React lifecycle integration for navigation, theme, carousels, filtering, map and forms.
- `server/`: authenticated Express API, Drizzle schema, migrations, sanitization and seeding.
- `content/pages.json`: reproducible initial import; not shipped as a public draft fallback.
- `assets/scss/`: original editable Sass. Additional React responsive fixes are in `web/src/public-overrides.css`.

```powershell
npm test
npm run build
node --env-file=.env scripts/verify-browser.mjs
```

The browser verification requires installed Chrome and the current administrator password in the environment. It temporarily edits the contact page title, checks draft isolation and publish, then restores the original. Do not run it while another editor is working on that page.

`npm run import:html` regenerates the initial seed from root HTML. It does not overwrite database content; `db:seed` is intentionally idempotent. Cloudflare Pages now serves published page content and metadata in the initial HTML through `functions/_middleware.js`, then React takes over the interactive interface. Local Vite development still uses client rendering.

Reference: [Railway config](https://docs.railway.com/config-as-code/reference), [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/), [Neon Drizzle guide](https://neon.com/docs/guides/drizzle).


## Service cards and detail pages

Service grids on Home and Services now have expandable item editors. Each item has a title, short information, image upload/library, image description, visibility toggle, move controls, and delete. Section introduction fields remain editable above the cards. Grids are page-specific; editing Home does not silently overwrite Services.

Create detail page generates an unpublished service page with a banner, overview, offerings, benefits and enquiry section using the existing service design. The card is linked to the draft. Save the grid draft, open the detail page, fill in its content and SEO, and publish it. Then publish the grid. The API blocks publishing visible service-card links to missing/unpublished service pages. Hiding/deleting a card affects that grid only and does not delete its detail page or remove it from search results; use the detail page's noindex option when appropriate.

## SEO deployment update

Deploy the API changes on Railway **before** the frontend changes on Cloudflare. Existing JSON page records are backward-compatible; no database migration or reseeding is needed.

Add a Cloudflare Pages production variable:

```text
SITE_URL=https://cameo-edc.pages.dev
```

Use your final canonical custom domain here once connected. Keep `API_ORIGIN` set to the Railway API URL. Configure the equivalent `SITE_URL` for preview deployments to make alternate preview hosts noindex. Cloudflare's middleware returns HTML for all visitors, not only crawlers.

Page settings now include SEO title, description, canonical override, index/follow controls, Open Graph and Twitter card fields, social-image upload and alt text, generated Service/WebPage and breadcrumb JSON-LD, plus validated additional JSON-LD. Custom schema must describe actual visible content. Invalid JSON is rejected by the API. Title lengths and heading/alt checks are guidance, not ranking scores.

- `/sitemap.xml` contains published indexable pages, excluding alternate canonical URLs.
- `/robots.txt` provides crawl rules and the sitemap URL.
- Admin and preview responses are noindex.
- Missing pages return an HTTP 404; API outages return a retryable 503 rather than an empty indexable page.
- Legacy `.html` and trailing-slash page URLs redirect to their clean paths.
- Canonicals exclude tracking query strings. Metadata and page content are in the initial HTML for social bots and crawlers.

After deployment, check View Source, the sitemap, and a social-link preview. Submit `/sitemap.xml` in Google Search Console and validate applicable structured data with Google's Rich Results Test. Indexing, rich-result eligibility and rankings depend on content and search-engine decisions; metadata does not guarantee them.
