# Arrivo — Production Runbook

This document covers what to do when things break in production. All Supabase SQL examples assume you are in **SQL Editor** using the service role (i.e. RLS is enforced — use the service role connection string or the SQL editor, which runs as `postgres`).

---

## Checking logs

### Vercel logs

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → select the Arrivo project.
2. Click **Deployments** → select the latest deployment → **Functions** tab for per-route invocation logs.
3. For real-time streaming: **Logs** tab → filter by Function or by status code.

Useful filters:
- Filter by path `/api/enviar-campana` to see campaign send errors.
- Filter by `500` to find all server errors.
- Filter by `/api/webhooks/resend` or `/api/stripe/webhook` to debug webhook failures.

To tail logs via CLI:
```bash
vercel logs <deployment-url> --follow
```

### Supabase logs

1. Supabase Dashboard → **Logs** (left sidebar).
2. **API logs** show every request hitting PostgREST — useful for diagnosing RLS violations (`403`) or malformed queries.
3. **Auth logs** show sign-in, sign-up, and token refresh events.
4. **Postgres logs** are available under Logs → Postgres. Look for constraint violations or slow queries.

---

## Resend webhook deliveries

1. Resend Dashboard → **Webhooks** → click your endpoint.
2. The **Attempts** tab shows every delivery with status, payload, and response body.
3. To replay a failed event: click the attempt → **Resend** button.

If events are arriving but contacts are not updating, check:
- The `?secret=` query param in the registered URL matches `RESEND_WEBHOOK_SECRET` in Vercel env vars.
- The Resend tag `contacto_id` is present on the email. Emails sent without a `contacto_id` (e.g. transactional payment emails) are silently ignored by the webhook handler — this is expected.

---

## Manually update a contact state in Supabase

Use the SQL Editor (Dashboard → SQL Editor → New query) with the `postgres` role, which bypasses RLS.

**Mark a contact as sent:**
```sql
UPDATE contactos
SET estado = 'enviado', fecha_envio = now()
WHERE id = '<contacto-uuid>';
```

**Mark a contact as opened:**
```sql
UPDATE contactos
SET estado = 'abierto', fecha_apertura = now()
WHERE id = '<contacto-uuid>';
```

**Mark a contact as replied:**
```sql
UPDATE contactos
SET estado = 'respondido', fecha_respuesta = now()
WHERE id = '<contacto-uuid>';
```

**Reset a contact back to pending (to re-send):**
```sql
UPDATE contactos
SET estado = 'pendiente', fecha_envio = NULL
WHERE id = '<contacto-uuid>';
```

**Set a pipeline stage on a replied contact:**
```sql
UPDATE contactos
SET etapa_pipeline = 'call_agendada'
WHERE id = '<contacto-uuid>'
  AND estado = 'respondido';
-- Valid values: respondio, call_agendada, propuesta_enviada,
--               negociando, cerrado_ganado, cerrado_perdido
```

**Find a contact by email:**
```sql
SELECT id, nombre, email, estado, campana_id, fecha_envio, fecha_apertura
FROM contactos
WHERE email = 'contacto@empresa.com';
```

---

## Disable or pause a user account

There is no hard-delete UI; the safest approach is to downgrade the user to `free` and zero out their credits, which prevents any further sends or enrichments.

**Downgrade to free plan and remove credits:**
```sql
UPDATE perfiles
SET plan = 'free',
    creditos_restantes = 0,
    stripe_subscription_id = NULL
WHERE email = 'usuario@example.com';
```

**To also cancel their Stripe subscription**, find the `stripe_subscription_id`:
```sql
SELECT stripe_customer_id, stripe_subscription_id
FROM perfiles
WHERE email = 'usuario@example.com';
```

Then cancel in the Stripe Dashboard: Customers → find the customer → Subscriptions → Cancel.

**To block login entirely**, go to Supabase Dashboard → Authentication → Users → find the user → click the three-dot menu → **Ban user**. This invalidates all existing sessions and prevents new sign-ins.

---

## Test the pixel tracking endpoint manually

The endpoint `GET /api/track/open/[id]` returns a 1×1 transparent GIF and marks the contact as `abierto`. To test it:

```bash
curl -I "https://arrivo.es/api/track/open/<contacto-uuid>"
```

Expected response:
```
HTTP/2 200
content-type: image/gif
cache-control: no-store, no-cache, must-revalidate, proxy-revalidate
```

After the request, check the contact row:
```sql
SELECT id, estado, fecha_apertura
FROM contactos
WHERE id = '<contacto-uuid>';
```

The endpoint is idempotent — if the contact is already in `abierto`, `respondido`, `rebotado`, or `error`, it will not update the row again (it only updates when `estado = 'enviado'`).

---

## Re-trigger failed follow-ups

Follow-ups in `seguimientos` with `estado = 'pendiente'` and a `fecha_programada` in the past are processed by a POST to `/api/seguimientos`.

**Check what is overdue:**
```sql
SELECT s.id, s.numero_seguimiento, s.fecha_programada,
       c.email, c.nombre, c.estado AS estado_contacto
FROM seguimientos s
JOIN contactos c ON c.id = s.contacto_id
WHERE s.estado = 'pendiente'
  AND s.fecha_programada < now()
ORDER BY s.fecha_programada ASC;
```

**Re-trigger processing via API (dry run):**
```bash
curl -X POST https://arrivo.es/api/seguimientos \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"modo": "test"}'
```

**Re-trigger in real mode (actually sends emails):**
```bash
curl -X POST https://arrivo.es/api/seguimientos \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"modo": "real"}'
```

The endpoint requires a valid user session cookie. Obtain it by logging in via the browser and copying the `sb-*` cookie from DevTools → Application → Cookies.

Follow-ups for contacts in `estado = 'respondido'` are automatically cancelled (not sent) by the handler.

**Manually cancel all pending follow-ups for a specific contact:**
```sql
UPDATE seguimientos
SET estado = 'cancelado'
WHERE contacto_id = '<contacto-uuid>'
  AND estado = 'pendiente';
```

**Re-open a cancelled follow-up so it gets picked up again:**
```sql
UPDATE seguimientos
SET estado = 'pendiente',
    fecha_programada = now() + interval '10 minutes'
WHERE id = '<seguimiento-uuid>';
```

---

## Common production issues

### Emails not sending

**Symptom:** `/api/enviar-campana` returns `{ enviados: 0, errores: [...] }` or contacts stay in `pendiente`.

**Checks:**
1. Verify `RESEND_API_KEY` is set correctly in Vercel env vars (Settings → Environment Variables). Restart the deployment after any env change.
2. Check that `RESEND_FROM_EMAIL` (`noreply@arrivo.es`) is on a verified domain in the Resend Dashboard. Unverified domains cause all sends to fail silently.
3. Look at Vercel function logs for the `/api/enviar-campana` route — errors from Resend are logged with the contact email.
4. Confirm the campaign contacts have `email_generado IS NOT NULL`:
   ```sql
   SELECT COUNT(*) FROM contactos
   WHERE campana_id = '<campana-uuid>'
     AND estado = 'pendiente'
     AND email_generado IS NOT NULL;
   ```
   If zero, run `/api/generar-emails` for the campaign first.
5. Check the daily limit: if `campanas.limite_diario > 0` and all slots are used, the API returns HTTP 429. The counter resets at midnight.

---

### Resend webhook not firing

**Symptom:** Emails are delivered (visible in Resend sends list) but contact state never changes from `enviado`.

**Checks:**
1. Resend Dashboard → Webhooks → your endpoint → **Attempts** tab. Look for failed deliveries (non-200 responses).
2. The most common cause: the `?secret=` in the webhook URL does not match `RESEND_WEBHOOK_SECRET`. Compare values in Vercel env vars and the registered URL.
3. If the endpoint returns 401, the secret is wrong. Update the webhook URL in Resend to use the correct secret.
4. Confirm the events `email.bounced`, `email.opened`, `email.complained` are all checked on the endpoint.
5. If the attempt shows 200 but the contact did not update, check that the email was tagged with `contacto_id`. Emails sent before this tagging was added will not have the tag and are silently ignored.

---

### Stripe webhook not firing / plan not upgrading

**Symptom:** User completes checkout but their plan in `perfiles` stays as `free`.

**Checks:**
1. Stripe Dashboard → Developers → Webhooks → your endpoint → **Recent deliveries**. Look for failed events.
2. Check that `STRIPE_WEBHOOK_SECRET` in Vercel matches the signing secret for the registered endpoint (not the `stripe listen` local one).
3. Confirm the endpoint URL is `https://arrivo.es/api/stripe/webhook` (no trailing slash).
4. If the delivery shows a 400 response with body `{"error":"Webhook inválido"}`, the signing secret is wrong.
5. Manually update the user's plan as a workaround while investigating:
   ```sql
   UPDATE perfiles
   SET plan = 'pro', creditos_restantes = 1500,
       stripe_subscription_id = 'sub_...'
   WHERE email = 'usuario@example.com';
   ```
6. Check that the four required events are registered: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

---

### Contacts stuck in `pendiente`

**Symptom:** Contacts have `email_generado` set but never move to `enviado` after a send attempt.

**Checks:**
1. Look at the API response from `/api/enviar-campana` — it returns `errores[]` with per-contact error messages.
2. Check if the contacts are actually in `estado = 'pendiente'`:
   ```sql
   SELECT estado, COUNT(*) FROM contactos
   WHERE campana_id = '<campana-uuid>'
   GROUP BY estado;
   ```
3. If contacts are in `estado = 'error'`, Resend rejected the send (invalid email format, domain block, etc.). The error message is in Vercel logs.
4. If the campaign has a `limite_diario` set, check how many were sent today:
   ```sql
   SELECT COUNT(*) FROM contactos
   WHERE campana_id = '<campana-uuid>'
     AND estado IN ('enviado', 'abierto', 'respondido')
     AND fecha_envio >= date_trunc('day', now());
   ```
5. The send endpoint (`/api/enviar-campana`) requires `modo: 'real'` in the request body. The default is `modo: 'test'`, which simulates the send without calling Resend.

---

### Open tracking not recording

**Symptom:** Emails are opened (visible in Resend) but contacts stay in `enviado`.

**Checks:**
1. Confirm `NEXT_PUBLIC_APP_URL` in Vercel is set to `https://arrivo.es` (no trailing slash). If it is `http://localhost:3000`, the pixel URL in sent emails points to localhost and never fires.
2. Test the pixel endpoint directly (see "Test the pixel tracking endpoint manually" above).
3. Some email clients block external images entirely. In this case, rely on the `email.opened` Resend webhook event as a fallback — it fires even when the pixel is blocked.
4. The tracking pixel is only embedded when `contacto_id` is passed to `enviarEmail`. Emails sent directly via the Resend Dashboard will not have the pixel.

---

### `perfiles` row missing for a user

**Symptom:** A user can log in but gets errors on every API call because their `perfiles` row does not exist.

**Cause:** The `handle_new_user` trigger failed at registration time (e.g. the `perfiles` table had a schema mismatch).

**Fix:** Manually insert the missing row:
```sql
INSERT INTO perfiles (id, email, plan, creditos_restantes)
VALUES ('<auth-user-uuid>', 'usuario@example.com', 'free', 25)
ON CONFLICT (id) DO NOTHING;
```

Get the UUID from Supabase Dashboard → Authentication → Users.

---

### Campaign stuck in `procesando`

**Symptom:** A campaign shows `estado = 'procesando'` but nothing is happening.

**Cause:** The `/api/enviar-campana` request timed out (Vercel functions have a 60s limit on the free plan) mid-send, leaving the campaign in an intermediate state.

**Fix:** Reset the campaign and any contacts that were not updated:
```sql
-- Reset campaign state
UPDATE campanas
SET estado = 'borrador'
WHERE id = '<campana-uuid>' AND estado = 'procesando';

-- Any contacts incorrectly left in limbo can be reset
UPDATE contactos
SET estado = 'pendiente', fecha_envio = NULL
WHERE campana_id = '<campana-uuid>'
  AND estado = 'procesando';
```

Then re-trigger the send in smaller batches by setting `limite_diario` on the campaign.
