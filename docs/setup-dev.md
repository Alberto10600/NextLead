# Arrivo — Developer Setup Guide

B2B prospecting SaaS built on Next.js 14 App Router + TypeScript. This guide gets a new developer from zero to a running local environment.

---

## Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Node.js | 20.x LTS | `node -v` |
| npm | 10.x | `npm -v` |
| Git | 2.x | `git --version` |

A Supabase account, a Resend account, a Stripe account (test mode), a Hunter.io account, and an Anthropic API key are all required before running the app.

---

## 1. Clone and install

```bash
git clone <repo-url> arrivo
cd arrivo
git checkout claude/new-project-setup-DTtMo
npm install
```

---

## 2. Environment variables

Copy the example file and fill in every value:

```bash
cp .env.example .env.local
```

Open `.env.local` and set the following:

### Anthropic / Claude AI

```
ANTHROPIC_API_KEY=sk-ant-...
```

Used by `/api/generar-emails` and `/api/seguimientos` to draft outbound emails and follow-ups via Claude.

Get it at: [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.

---

### Hunter.io

```
HUNTER_API_KEY=...
```

Used by `/api/enriquecer-contactos` to find and verify email addresses for prospects.

Get it at: [hunter.io/api-keys](https://hunter.io/api-keys).

---

### Supabase

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- `NEXT_PUBLIC_SUPABASE_URL` — the project URL shown in Supabase Dashboard → Settings → API.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to expose client-side; used for authenticated user queries.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, bypasses RLS. Used by webhook handlers (`/api/webhooks/resend`, `/api/track/open/[id]`) that run without a user session. Never expose this to the browser.

Get all three at: Supabase Dashboard → Settings → API.

---

### Stripe

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- `STRIPE_SECRET_KEY` — server-side key for creating customers, sessions, and portal links.
- `STRIPE_WEBHOOK_SECRET` — used by `/api/stripe/webhook` to verify that events actually come from Stripe. Generated when you create a webhook endpoint (see Stripe setup section below).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — client-side key for the Stripe.js SDK.

Get them at: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys).

---

### Stripe Price IDs

```
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
```

These map to the three recurring price objects you create in the Stripe Dashboard (see Stripe setup section). The webhook handler uses these to determine which `plan` to write to `perfiles`.

Credits per plan (set automatically on checkout):
- `starter` → 600 credits
- `pro` → 1 500 credits
- `business` → 3 000 credits
- `free` → 25 credits (default for new signups)

---

### Resend

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@arrivo.es
RESEND_WEBHOOK_SECRET=<random-string>
```

- `RESEND_API_KEY` — authenticates all email sends via `lib/resend.ts`.
- `RESEND_FROM_EMAIL` — the `From` address on every outbound email. Must be on a verified domain in Resend.
- `RESEND_WEBHOOK_SECRET` — a secret you choose; appended as `?secret=<value>` to the webhook URL you register in Resend. The handler at `/api/webhooks/resend` checks this string on every incoming event.

Get `RESEND_API_KEY` at: [resend.com/api-keys](https://resend.com/api-keys).

For local dev, generate a random secret: `openssl rand -hex 32`.

---

### App URL

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Used to build the pixel tracking URL embedded in sent emails (`/api/track/open/[id]`). Change to your production domain before deploying.

---

## 3. Supabase setup

### 3a. Create a project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Choose a region close to your users (Spain → `eu-west-1` / Frankfurt).
3. Note the project URL and API keys (Settings → API).

### 3b. Run the base schema

In the Supabase Dashboard, open **SQL Editor → New query**, paste the contents of `supabase-schema.sql`, and click **Run**.

This creates the following tables:

| Table | Purpose |
|-------|---------|
| `perfiles` | One row per auth user; holds plan, Stripe IDs, credits |
| `campanas` | Email campaigns with sector, target roles, daily limit, tone |
| `contactos` | Individual prospects with state machine (`pendiente → enviado → abierto → respondido / rebotado / error`) |
| `seguimientos` | Scheduled follow-up emails per contact |
| `historial_contactos` | Deduplication log — prevents re-contacting the same email |
| `plantillas` | Saved email pitch templates per user (added in migration 001) |

It also creates:
- RLS policies so each user only sees their own rows.
- A `handle_new_user` trigger that auto-inserts a row into `perfiles` whenever someone registers via Supabase Auth.

### 3c. Run migrations in order

After the base schema, run each migration file in the SQL Editor in this exact order:

**Migration 001** — `supabase/migrations/001_p2_features.sql`

Adds `tono`, `dias_seguimiento`, and `limite_diario` columns to `campanas`. Creates the `plantillas` table with its RLS policy.

**Migration 002** — `supabase/migrations/002_contact_limits_index.sql`

Adds an index on `contactos(user_id, created_at)` to speed up the monthly contact count queries used for plan limits.

**Migration 003** — `supabase/migrations/003_pipeline.sql`

Adds `etapa_pipeline` column to `contactos` with a CHECK constraint (`respondio`, `call_agendada`, `propuesta_enviada`, `negociando`, `cerrado_ganado`, `cerrado_perdido`). Adds a partial index on `contactos(user_id, estado, etapa_pipeline)` for fast pipeline queries.

To paste a migration: SQL Editor → New query → paste contents → Run.

### 3d. Enable Email Auth

Supabase Dashboard → Authentication → Providers → Email → Enable.

For local dev you can disable email confirmation (Authentication → Settings → "Confirm email" toggle off) to speed up testing.

---

## 4. Resend setup

### 4a. Verify your domain

1. Resend Dashboard → Domains → Add domain → enter `arrivo.es` (or your dev domain).
2. Add the DNS records Resend provides (SPF, DKIM, DMARC) to your domain registrar.
3. Wait for verification (usually under 10 minutes).

### 4b. Create an API key

Resend Dashboard → API Keys → Create API Key → select "Full access" → copy to `RESEND_API_KEY`.

### 4c. Register the webhook

Resend Dashboard → Webhooks → Add endpoint.

- **URL**: `https://your-app.vercel.app/api/webhooks/resend?secret=<RESEND_WEBHOOK_SECRET>`
- For local dev with tunnelling: `https://<ngrok-url>/api/webhooks/resend?secret=<RESEND_WEBHOOK_SECRET>`

**Events to enable:**

| Event | What it does in Arrivo |
|-------|----------------------|
| `email.bounced` | Sets contact `estado = 'rebotado'`, cancels pending `seguimientos` |
| `email.opened` | Sets contact `estado = 'abierto'` (backup to pixel tracking) |
| `email.complained` | Marks contact as `rebotado`, cancels follow-ups (spam complaint) |

The handler at `/api/webhooks/resend` identifies which contact to update via a `contacto_id` tag attached to every sent email.

### 4d. Local webhook testing with ngrok

```bash
npx ngrok http 3000
# Copy the https URL and use it in the Resend webhook config above
```

---

## 5. Stripe setup

### 5a. Create products and prices

In the Stripe Dashboard (test mode):

1. Products → Add product → **Arrivo Starter**
   - Add a recurring price: e.g. €29/month
   - Copy the Price ID (`price_...`) → `STRIPE_PRICE_STARTER`

2. Repeat for **Arrivo Pro** → `STRIPE_PRICE_PRO`

3. Repeat for **Arrivo Business** → `STRIPE_PRICE_BUSINESS`

### 5b. Register the webhook endpoint

Stripe Dashboard → Developers → Webhooks → Add endpoint.

- **URL**: `https://your-app.vercel.app/api/stripe/webhook`

Note: `/api/stripe/webhook` is explicitly exempted from the session middleware in `middleware.ts` — do not add auth headers to this endpoint.

**Events to enable:**

| Event | What it does |
|-------|-------------|
| `checkout.session.completed` | Upgrades user plan and sets `creditos_restantes` in `perfiles` |
| `customer.subscription.updated` | Updates plan when user changes tier |
| `customer.subscription.deleted` | Downgrades user to `free` plan |
| `invoice.payment_failed` | Sends payment failure email to the user |

After adding the endpoint, Stripe shows the **Signing secret** (`whsec_...`) → copy to `STRIPE_WEBHOOK_SECRET`.

### 5c. Enable the customer portal

Stripe Dashboard → Settings → Billing → Customer portal → Enable. This powers the `/api/stripe/portal` endpoint.

### 5d. Test webhooks locally

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This also prints a local `whsec_...` signing secret — use it as `STRIPE_WEBHOOK_SECRET` during local development.

---

## 6. Run the dev server

```bash
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

Register a user at `/registro`. Supabase will auto-create a row in `perfiles` via the `handle_new_user` trigger.

---

## 7. Common errors and fixes

### `Error: supabaseUrl is required`
`.env.local` is missing or the variable names have a typo. Confirm `NEXT_PUBLIC_SUPABASE_URL` is set and restart the dev server — Next.js does not hot-reload env changes.

### `new row violates row-level security policy`
The service role key is not being used where it should be. Webhook handlers and the pixel tracking route must use `SUPABASE_SERVICE_ROLE_KEY` (via `createClient` with the service role key), not the anon key.

### `Error: No hay contactos pendientes con email generado`
`/api/enviar-campana` requires contacts to have `email_generado` set. Run `/api/generar-emails` for the campaign first.

### Resend webhook returns 401
The `?secret=` query param in the webhook URL does not match `RESEND_WEBHOOK_SECRET`. Double-check both values.

### Stripe webhook returns 400 `Webhook inválido`
The `STRIPE_WEBHOOK_SECRET` does not match the signing secret for the registered endpoint. If testing locally with `stripe listen`, use the local signing secret it prints, not the Dashboard one.

### `plantillas` table does not exist
Migration 001 has not been run. Open Supabase SQL Editor and run `supabase/migrations/001_p2_features.sql`.

### `etapa_pipeline` column does not exist
Migration 003 has not been run. Run `supabase/migrations/003_pipeline.sql`.

### Email sends succeed but open tracking never fires
`NEXT_PUBLIC_APP_URL` is set to `localhost` in production, so the pixel URL is wrong. Set it to the production URL in Vercel environment variables.

### Hunter.io returns no results
The free tier has a limited number of requests per month. Check your usage at [hunter.io/users/me](https://hunter.io/users/me). The `/api/enriquecer-contactos` route will still save contacts without an email; they will be skipped during send.
