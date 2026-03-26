# NextLead — SaaS de Prospección B2B para Agencias de Marketing

Encuentra clientes potenciales automáticamente con IA. Emails personalizados y seguimientos automáticos.

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Supabase** (Base de datos + Auth)
- **Stripe** (Pagos y suscripciones)
- **Resend** (Envío de emails)
- **Anthropic Claude** (Generación de contenido)
- **Hunter.io** (Búsqueda de contactos)

---

## Setup inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y rellena todas las claves:

```bash
cp .env.example .env.local
```

**Servicios necesarios:**

| Servicio | Web | Para qué |
|----------|-----|----------|
| Anthropic | console.anthropic.com | Claude AI — genera dominios y emails |
| Hunter.io | hunter.io | Busca emails por dominio |
| Supabase | supabase.com | Base de datos y autenticación |
| Stripe | stripe.com | Pagos y suscripciones |
| Resend | resend.com | Envío de emails |

### 3. Base de datos Supabase

Ejecuta el contenido de `supabase-schema.sql` en el **SQL Editor** de tu proyecto Supabase.

### 4. Configurar Stripe

En el dashboard de Stripe, crea 3 productos con suscripción mensual:
- **Starter**: €89/mes → copia el Price ID a `STRIPE_PRICE_STARTER`
- **Pro**: €149/mes → copia el Price ID a `STRIPE_PRICE_PRO`
- **Business**: €279/mes → copia el Price ID a `STRIPE_PRICE_BUSINESS`

Para el webhook local usa Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Arrancar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Flujo de la aplicación

1. **Usuario crea campaña** → define sector, país, cargos objetivo y descripción de su agencia
2. **Buscar contactos** → Claude AI genera dominios reales del sector → Hunter.io extrae emails
3. **Deduplicación** → elimina duplicados y contactos ya contactados en los últimos 30 días
4. **Generación de emails** → Claude redacta emails personalizados analizando la web de cada empresa
5. **Envío** → Resend envía los emails y programa follow-ups automáticos (3, 7 y 14 días)

---

## Planes

| Plan | Precio | Contactos/mes | Campañas | Follow-ups |
|------|--------|---------------|----------|------------|
| Free | Gratis | 25 | 1 | 0 |
| Starter | €89/mes | 600 | 3 | 1 |
| Pro | €149/mes | 1.500 | 10 | 3 |
| Business | €279/mes | 3.000 | Ilimitadas | 5 |

---

## Estructura del proyecto

```
/app
  /page.tsx                          → Landing page
  /login/page.tsx                    → Login
  /registro/page.tsx                 → Registro
  /dashboard/page.tsx                → Dashboard principal
  /dashboard/campanas/               → Gestión de campañas
  /dashboard/seguimientos/page.tsx   → Follow-ups
  /dashboard/contactos/page.tsx      → Historial
  /precios/page.tsx                  → Planes
  /api/...                           → API Routes

/components
  /landing/                          → Hero, Features, Precios
  /auth/                             → Formularios login/registro
  /dashboard/                        → Sidebar, Header, tablas, modales
  /ui/                               → Button, Input, Modal, Badge...

/lib
  /supabase/                         → Clientes browser y servidor
  /claude.ts                         → Wrapper Claude API
  /hunter.ts                         → Wrapper Hunter.io
  /resend.ts                         → Wrapper Resend
  /stripe.ts                         → Wrapper Stripe
  /scraper.ts                        → Scraping web básico
  /deduplicacion.ts                  → Lógica antiduplicados
  /utils.ts                          → Helpers

/types/index.ts                      → Todos los tipos TypeScript
/middleware.ts                       → Protección de rutas
/supabase-schema.sql                 → Schema completo de BD
```
