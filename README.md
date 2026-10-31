# Brightstone Permanent Lighting — Yorba Linda

Vite + React site with a 6-step booking calendar, Stripe deposit checkout, and a Cloudflare Worker + D1 backend.

| Plumbing | Value |
|---|---|
| Source tag | `brightstone-yorbalinda` |
| Booking ID prefix | `BSL-` (e.g. `BSL-261030-7KQ2`) |
| Worker | `brightstone-yorbalinda-api` |
| Pages project | `brightstone-permanent-lighting-yorba-linda` |
| GitHub repo (suggested) | `servicepros714/brightstone-permanent-lighting-yorba-linda` |

## 1. Fill in the business details

Edit **`src/config/site.js`**. Search it for `TODO`:

- **Phone and hours** — set in `phoneDisplay`, `phoneHref` and `hours`. If they change, also update `index.html` (JSON-LD `telephone`, `openingHoursSpecification` and the `<noscript>` line).
- **Prices** — `price: null` shows "Online quoting". Set a number to show "Starting at $X".
- **Reviews** — `REVIEWS` is empty, so the section shows service commitments instead. Paste real reviews only.
- **Gallery** — the 9 images are illustrated design previews, labeled "Design preview" on the site. Swap in photos of real installs and set `preview: false`.
- **Cities, takedown timing, Google review link.**
- **Permanent system details** (controller/app, warranty) — nothing is claimed yet. Add them to `PERMANENT_ROW` once confirmed.

If you change the domain, also update it in `index.html` (canonical, OG, JSON-LD), `public/robots.txt` and `public/sitemap.xml`.

## 2. Run locally (Windows CMD)

```cmd
cd brightstone-permanent-lighting-yorba-linda
npm install
npm run dev
```

Open http://localhost:5173. Put your real public values in `.env.local`:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE=https://brightstone-yorbalinda-api.<your-subdomain>.workers.dev
```

`.env.local` only holds public values. It is committed on purpose so the GitHub build can read it.
**Never** put the Stripe secret key in this repo.

## 3. Push to GitHub (Windows CMD)

Create the empty repo on github.com first, then:

```cmd
cd brightstone-permanent-lighting-yorba-linda
git init
git add .
git commit -m "Brightstone Yorba Linda site"
git branch -M main
git remote add origin https://github.com/servicepros714/brightstone-permanent-lighting-yorba-linda.git
git push -u origin main
```

## 4. Cloudflare (dashboard only)

**D1** — use the shared bookings database. If the table doesn't exist yet, open D1 → your database → Console and run `worker/schema.sql`. It is safe to re-run.

**Worker** — Workers & Pages → Create → Worker → name it `brightstone-yorbalinda-api` → Edit code → paste `worker/worker.js` → Deploy. Then:
- Settings → Bindings → Add → D1 database → variable name `DB` → choose the shared database.
- Settings → Variables and Secrets → add **Secret** `STRIPE_SECRET_KEY`.
- Optional: `ADMIN_TOKEN` (secret). GET/PATCH `/api/bookings` stay closed until it is set, then require `Authorization: Bearer <token>`.
- Optional: `ALLOWED_ORIGIN` (e.g. your live domain). It defaults to `*`.
- Copy the Worker URL. That is `VITE_API_BASE`.

**Pages** — Workers & Pages → Create → Pages → Upload assets (Direct Upload) → name it `brightstone-permanent-lighting-yorba-linda` → upload any placeholder folder once to create the project. The GitHub Action deploys into it from then on.

**GitHub repo secrets** (Settings → Secrets and variables → Actions):
- `CLOUDFLARE_API_TOKEN` — a token with Cloudflare Pages: Edit
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_API_BASE` (optional; when set they override `.env.local`)

Every push to `main` builds and deploys. `public/_redirects` (`/* /index.html 200`) makes `/book`, `/checkout` and `/confirmation` load on refresh.

## 5. Stripe

- Settings → Payment methods: turn on cards plus Apple Pay / Google Pay / Link as wanted. The site uses automatic payment methods.
- Settings → Payment method domains: add the live domain and the `pages.dev` domain so the express buttons show.
- Test card: `4242 4242 4242 4242`, any future date, any CVC.

## Booking flow

1. Lighting type: Permanent / Seasonal
2. Package: Front Only / Front & Sides
3. Home height (1-Story / 2-Story +50%) + add-ons. Off-season storage is hidden for Permanent.
4. Install date: Oct 20 – Dec 20, every day, Pacific time
5. Time window: `8AM–12PM` / `12PM–4PM`. The earliest window is 48 hours after current California time.
6. Your info: Full Name, Phone, Email, Service Address

Then checkout: a $149 Stripe deposit applied to the final invoice, or the plain "I'll pay at the visit" link (`payment_status = 'Pay Later'`).

## Stored values (shared D1 columns, no new columns)

| Column | Example |
|---|---|
| `id` | `BSL-261030-7KQ2` |
| `date` / `time` | `2026-12-06` / `12PM–4PM` (en dash) |
| `service` | `Front & Sides` |
| `vehicle` | `Seasonal · 2-Story · Front & Sides · +Tree wrap · +Wreaths` |
| `notes` | `Type: Seasonal \| Add-ons: … \| Estimate: Online quoting \| Deposit: $149 paid \| PI: pi_… \| Ref: BSR-…` |
| `source` | `brightstone-yorbalinda` |
| `status` | `Booked` |
| `payment_status` | `Paid` or `Pay Later` |

PATCHABLE: `status, reschedule_date, reschedule_time, notes2, original_date, original_time, payment_status, date, time`.

## Worker API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/availability?date=YYYY-MM-DD` | Unavailable windows that day (source-scoped, includes the 48-hour lead time) |
| GET | `/api/availability?from=&to=` | Dates with no window left |
| POST | `/api/create-payment-intent` | $149 PaymentIntent with `automatic_payment_methods`. Never touches D1 |
| POST | `/api/bookings` | `Paid` is verified with Stripe first. The same PaymentIntent or draft ref never makes two rows. Pay Later on a taken slot → 409. A paid booking that loses a slot race is still saved, flagged `SLOT CONFLICT` in notes |
| GET | `/api/bookings` | Admin list (needs `ADMIN_TOKEN`) |
| PATCH | `/api/bookings/:id` | Admin update of PATCHABLE fields (needs `ADMIN_TOKEN`) |

A rescheduled booking holds its `reschedule_date` / `reschedule_time` slot. Cancelled bookings free their slot.

## Known recurring bugs — fixed in this build

- **ensureSchema blocking payment** — the payment-intent route never calls D1. Schema setup is memoized, and its errors are caught and logged.
- **`.exec()` newline parsing** — no `exec()`. Each statement is a single-line `prepare().run()`.
- **Nav grid mismatch** — the nav is flex, so there are no grid columns to mismatch.
- **`.btn` background** — the base `.btn` resets appearance, border and background. Every variant sets its own background.
- **`.container` specificity** — defined once as a single class, never compounded.
- **ExpressCheckoutElement clientSecret** — `<Elements>` mounts only after the PaymentIntent exists, keyed on its clientSecret.
- **`strong` display bleed** — `strong, b { display: inline }` in `base.css`. Components never set display on `strong`.

## Layout used on this site (uniqueness record)

Palette from logo: onyx `#0C0C0E`, graphite `#1B1B1E`, slate `#3D3F41`, molten gold `#F2C12E`, flare `#FBE36A`, amber `#D8890F`, bronze `#A85F06`, limestone `#EAE2D4`, plaster `#F6F1E8`, cocoa `#532D15`
- **Fonts:** Bricolage Grotesque + Figtree + Instrument Serif (italic)
- **Nav:** onyx bar with a hanging limestone logo plaque that tucks up on scroll; a bottom-sheet menu on mobile
- **Hero:** full-bleed Ken Burns slideshow, headline bottom-left, a glass ledger strip and gable-peak slide progress
- **Order:** Hero → Gallery → Packages → Reviews → How it works → Service area → Season calendar → FAQ → Final CTA
- **Packages:** Permanent vs Seasonal intro, full-width ledger rows, and a horizontal add-on rail
- **Gallery:** masonry with style filter chips
- **Motion:** "power-on" flicker reveals, Ken Burns drift, rocker switches that flip on, and marching-bulb CTA frame
- **Footer:** a gable-peaked limestone panel beside an onyx numbered index, with a legal bar
- **Booking:** split "work order" panel with a gable-row progress bar
