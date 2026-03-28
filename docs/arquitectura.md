# Arquitectura técnica — Arrivo

## Stack tecnológico

| Servicio | Rol | Por qué | Coste |
|---|---|---|---|
| Next.js 15 (App Router) | Frontend + API Routes | SSR nativo, React Server Components, rutas API en el mismo repo | Incluido en Vercel |
| Supabase | Base de datos + Auth | Postgres gestionado, Auth SSR con `@supabase/ssr`, RLS por defecto | Pro $25/mes |
| Claude Haiku (`claude-haiku-4-5-20251001`) | Generación de emails y análisis | Barato, rápido, suficiente calidad para copy B2B. Configurable vía `EMAIL_GENERATION_MODEL` | Variable (~$0.80/$4.00 por M tokens) |
| Hunter.io | Enriquecimiento de contactos | Única API con domain-search + filtros de departamento/seniority/tamaño | Growth $104/mes |
| Resend | Envío transaccional | API limpia, soporte de tags por email, deliverability alta | Pro $20/mes |
| Stripe | Pagos y suscripciones | Webhooks fiables, portal de cliente integrado | 1.4% + 0.25€/transacción |
| Vercel | Hosting | Deploy automático desde Git, Edge Functions, sin gestión de servidor | Pro $20/mes |

---

## Modelo de datos

Fuente de verdad: `/types/index.ts`.

### `perfiles`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | Igual que `auth.users.id` |
| `email` | string | |
| `nombre` | string? | |
| `agencia` | string? | Usado como `From:` name en emails |
| `plan` | `Plan` | `'free' \| 'starter' \| 'pro' \| 'business'` |
| `stripe_customer_id` | string? | |
| `stripe_subscription_id` | string? | |
| `creditos_restantes` | number | Reservado para uso futuro |
| `created_at` | string | |

### `campanas`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | FK → perfiles |
| `nombre` | string | |
| `sector` | string | Valor Hunter (p.ej. `'Retail'`) |
| `pais` | string | ISO-2 (p.ej. `'ES'`) |
| `descripcion_agencia` | string | Contexto del remitente para Claude |
| `cargos_objetivo` | string[] | |
| `dominios` | string[]? | Generados por Claude o introducidos manualmente |
| `filtros_hunter` | `FiltrosHunter`? | sector, pais, tamanos, departamentos, seniority |
| `estado` | `EstadoCampana` | `borrador \| procesando \| activa \| pausada \| completada` |
| `total_contactos` | number | |
| `total_enviados` | number | |
| `total_abiertos` | number | |
| `total_respondidos` | number | |
| `tono` | `Tono`? | `cercano \| formal \| millennial \| tecnico` |
| `dias_seguimiento` | number[]? | Días desde envío (p.ej. `[3,7,14]`). Default `[3,7,14]` |
| `limite_diario` | number? | 0 = sin límite |
| `created_at` / `updated_at` | string | |

### `contactos`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | FK → perfiles |
| `campana_id` | uuid | FK → campanas |
| `nombre` / `apellido` | string? | |
| `cargo` | string? | |
| `email` | string | |
| `empresa` | string? | |
| `dominio` | string? | |
| `linkedin_url` | string? | |
| `contexto_web` | string? | Resumen de `analizarEmpresa()` |
| `asunto_generado` | string? | Output de Claude |
| `email_generado` | string? | Output de Claude |
| `estado` | `EstadoContacto` | `pendiente \| enviado \| abierto \| respondido \| rebotado \| error \| no_contactar` |
| `fecha_envio` / `fecha_apertura` / `fecha_respuesta` | string? | |
| `numero_seguimiento` | number | Cuántos follow-ups se han enviado ya |
| `notas` | string? | |
| `etapa_pipeline` | `EtapaPipeline`? | `respondio \| call_agendada \| propuesta_enviada \| negociando \| cerrado_ganado \| cerrado_perdido` |
| `created_at` | string? | |
| `sector` | string? | Virtual: viene del JOIN con campanas |

### `seguimientos`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `contacto_id` | uuid | FK → contactos |
| `campana_id` | uuid | FK → campanas |
| `user_id` | uuid | FK → perfiles |
| `numero_seguimiento` | number | 1, 2, 3… |
| `asunto` / `cuerpo` | string? | Generados por Claude en el momento del envío |
| `estado` | `'pendiente' \| 'enviado' \| 'cancelado'` | |
| `fecha_programada` | string | ISO timestamp calculado al crear |
| `fecha_enviado` | string? | |
| `created_at` | string? | |

### `plantillas`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | |
| `nombre` | string | |
| `sector` | string | |
| `descripcion` | string | |
| `tono` | `Tono` | |
| `created_at` | string | |

### `historial_contactos`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `user_id` | uuid | |
| `email` | string | |
| `dominio` | string | |
| `fecha_ultimo_contacto` | string | |
| `total_contactos` | number | |
Clave única: `(user_id, email)` — upsert en cada envío para evitar contactar al mismo email dos veces.

### Tipos enumerados

| Tipo | Valores |
|---|---|
| `Plan` | `free \| starter \| pro \| business` |
| `EstadoCampana` | `borrador \| procesando \| activa \| pausada \| completada` |
| `EstadoContacto` | `pendiente \| enviado \| abierto \| respondido \| rebotado \| error \| no_contactar` |
| `EtapaPipeline` | `respondio \| call_agendada \| propuesta_enviada \| negociando \| cerrado_ganado \| cerrado_perdido` |
| `Tono` | `cercano \| formal \| millennial \| tecnico` |
| `HunterDepartamento` | `executive \| it \| finance \| management \| sales \| legal \| support \| hr \| marketing \| communication \| education \| design \| health \| operations` |
| `HunterSeniority` | `junior \| senior \| executive` |
| `HunterTamanoEmpresa` | `1-10 \| 11-50 \| 51-200 \| 201-500 \| 501-1000 \| 1001-5000 \| 5001-10000 \| 10001+` |

---

## Flujo de usuario: campaña completa

```
Usuario define campaña
  └─ nombre, sector, país, descripcion_agencia, tono, dias_seguimiento
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 1 — Obtener dominios                                      │
  │  Opción A: Claude genera dominios reales del sector/país        │
  │            generarDominiosPorSector() → ~42 tokens/dominio     │
  │  Opción B: Hunter Discover (filtros_hunter → /descubrir-        │
  │            empresas) → devuelve name + domain por empresa       │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 2 — Enriquecimiento Hunter                                │
  │  /api/enriquecer-contactos                                      │
  │  buscarTodosLosContactos(dominio) por cada dominio              │
  │  Pagina automáticamente (offset + 100 en plan paid)             │
  │  Devuelve: nombre, apellido, cargo, email, linkedin_url         │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 3 — Filtro de contactos (en cliente)                      │
  │  El usuario filtra por cargo, departamento, seniority           │
  │  Se descartan emails ya en historial_contactos                  │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 4 — Guardar contactos                                     │
  │  POST /api/guardar-contactos                                    │
  │  Comprueba LIMITES_PLAN[plan].contactos_mes vs contactos        │
  │  creados este mes (gte created_at inicio de mes)                │
  │  Inserta con estado='pendiente', numero_seguimiento=0           │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 5 — Generación de emails (Claude)                         │
  │  POST /api/generar-emails                                       │
  │  generarEmailProspeccion() por cada contacto                    │
  │  ~550 tokens/email (input + output)                             │
  │  Guarda asunto_generado + email_generado en contactos           │
  │  Usa skill personalizable en /prompts/email-prospeccion.md      │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 6 — Envío (Resend)                                        │
  │  POST /api/enviar-campana { campana_id, modo: 'real' }          │
  │  Respeta limite_diario de la campaña                            │
  │  Incrusta pixel de tracking en cada HTML                        │
  │  Actualiza estado → 'enviado', fecha_envio                      │
  │  Crea registros en seguimientos con fecha_programada calculada  │
  │  Upsert en historial_contactos para evitar re-contactar         │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 7 — Pixel tracking                                        │
  │  GET /api/track/open/[contacto_id]                              │
  │  Llamado por el cliente de email al cargar el 1x1 GIF           │
  │  supabaseAdmin (sin cookies) → estado: enviado → abierto        │
  │  Actualiza fecha_apertura + total_abiertos en campana           │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 8 — Follow-ups automáticos                                │
  │  POST /api/seguimientos { modo: 'real' }                        │
  │  (Llamado por cron o manualmente desde el dashboard)            │
  │  Filtra seguimientos WHERE estado='pendiente'                   │
  │    AND fecha_programada <= NOW()                                │
  │  Si contacto.estado='respondido' → cancelar seguimiento         │
  │  Si no tiene asunto/cuerpo → generarEmailSeguimiento() Claude   │
  │  Envía con Resend, marca estado='enviado'                       │
  │  Actualiza contacto.numero_seguimiento                          │
  └─────────────────────────────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  PASO 9 — Pipeline                                              │
  │  Cuando contacto.estado='respondido'                            │
  │  Usuario arrastra tarjeta entre etapas:                         │
  │  respondio → call_agendada → propuesta_enviada                  │
  │           → negociando → cerrado_ganado / cerrado_perdido       │
  │  PATCH /api/pipeline actualiza etapa_pipeline                   │
  └─────────────────────────────────────────────────────────────────┘
```

---

## Rutas API principales

| Ruta | Método | Qué hace |
|---|---|---|
| `/api/guardar-contactos` | POST | Inserta contactos, comprueba límite mensual del plan (`LIMITES_PLAN`) |
| `/api/generar-emails` | POST | Llama a `generarEmailProspeccion()` para cada contacto pendiente sin email |
| `/api/enviar-campana` | POST | Envía emails pendientes vía Resend, respeta `limite_diario`, crea registros en `seguimientos` |
| `/api/seguimientos` | POST | Procesa seguimientos cuya `fecha_programada` ya pasó; genera contenido con Claude si no existe |
| `/api/seguimientos` | GET | Lista todos los seguimientos del usuario con JOIN a contactos |
| `/api/seguimientos/[id]` | PATCH/DELETE | Actualiza o cancela un seguimiento individual |
| `/api/track/open/[id]` | GET | Pixel tracking: marca contacto como `abierto`, devuelve GIF 1x1 |
| `/api/buscar-por-sector` | POST | Genera dominios con Claude (`generarDominiosPorSector`) |
| `/api/descubrir-empresas` | POST | Hunter Discover API (`descubrirEmpresas`) |
| `/api/enriquecer-contactos` | POST | Hunter domain-search paginado (`buscarTodosLosContactos`) |
| `/api/analizar-empresa` | POST | Claude analiza contexto web de un dominio (`analizarEmpresa`) |
| `/api/campanas` | GET/POST | CRUD de campañas |
| `/api/campanas/[id]` | GET/PATCH/DELETE | Campaña individual |
| `/api/campanas/[id]/stats` | GET | Estadísticas agregadas de la campaña |
| `/api/contactos/[id]` | PATCH/DELETE | Editar/eliminar contacto individual |
| `/api/plantillas` | GET/POST | CRUD de plantillas |
| `/api/plantillas/[id]` | GET/PATCH/DELETE | Plantilla individual |
| `/api/pipeline` | GET/PATCH | Lee y actualiza `etapa_pipeline` de contactos |
| `/api/perfil` | GET/PATCH | Datos del perfil del usuario |
| `/api/stripe/checkout` | POST | Crea sesión de pago Stripe |
| `/api/stripe/portal` | POST | Abre portal de cliente Stripe |
| `/api/stripe/webhook` | POST | Actualiza `plan` en `perfiles` según eventos Stripe |
| `/api/webhooks/resend` | POST | Recibe eventos de Resend (bounce, delivery) → actualiza estado contacto |
| `/api/auth/callback` | GET | Callback OAuth de Supabase |
| `/api/auth/cambiar-password` | POST | Cambio de contraseña autenticado |

---

## Flujo de autenticación (Supabase SSR)

Arrivo usa `@supabase/ssr` en lugar del cliente Supabase clásico. Hay tres capas:

**Cliente navegador** (`/lib/supabase/client.ts`):
- `createBrowserClient(SUPABASE_URL, ANON_KEY)`
- Usado en componentes cliente (`'use client'`) para operaciones en tiempo real o formularios sin Server Action.

**Cliente servidor** (`/lib/supabase/server.ts`):
- `createServerClient(SUPABASE_URL, ANON_KEY, { cookies })` — lee/escribe cookies de Next.js
- Usado en todas las API Routes y Server Components para autenticar al usuario con `supabase.auth.getUser()`
- La sesión viaja en cookies HttpOnly; el middleware la refresca automáticamente.

**Cliente admin** (instanciado inline en `/api/track/open/[id]/route.ts`):
- `createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })`
- Usado únicamente en el endpoint de pixel tracking (ver sección siguiente).

**Middleware** (`/lib/supabase/middleware.ts`):
- Intercepta todas las rutas, refresca el token de sesión si está próximo a expirar y lo escribe de nuevo en las cookies de respuesta. Esto garantiza que el `access_token` siempre esté vigente sin que el usuario lo note.

---

## Arquitectura de pixel tracking

El endpoint `GET /api/track/open/[contacto_id]` no puede usar el cliente servidor estándar porque **no hay cookies en la petición**: el email se carga desde el cliente de correo del destinatario (Gmail, Outlook, Apple Mail…), que hace una petición HTTP directa al servidor sin ninguna sesión autenticada de Arrivo.

Por eso se instancia `supabaseAdmin` con la `SERVICE_ROLE_KEY`, que tiene acceso completo a la base de datos sin necesidad de sesión:

```ts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)
```

Flujo concreto:
1. Resend envía el email con un `<img src="https://arrivo.es/api/track/open/{contacto_id}" ...>` de 1x1px.
2. Al abrir el email, el cliente de correo carga la imagen.
3. El endpoint recibe el `contacto_id` del path, consulta el estado actual del contacto.
4. Si `estado === 'enviado'` (evitar dobles conteos), actualiza a `estado: 'abierto'` y `fecha_apertura`.
5. Recuenta los contactos en estado `abierto` para esa campaña y actualiza `campanas.total_abiertos`.
6. Devuelve el GIF transparente 1x1 con cabeceras `Cache-Control: no-store` para evitar cacheo.

---

## Sistema de límites por plan

Definido en `LIMITES_PLAN` en `/types/index.ts`:

```
free:     { precio_mensual: 0,   contactos_mes: 100,   campanas_activas: 1,   seguimientos: 0 }
starter:  { precio_mensual: 29,  contactos_mes: 500,   campanas_activas: 3,   seguimientos: 1 }
pro:      { precio_mensual: 79,  contactos_mes: 2000,  campanas_activas: 10,  seguimientos: 3 }
business: { precio_mensual: 199, contactos_mes: 10000, campanas_activas: 999, seguimientos: 5 }
```

**Dónde se aplica cada límite:**

- `contactos_mes` → enforced en `POST /api/guardar-contactos`. Cuenta los contactos con `created_at >= inicio_del_mes_actual` y devuelve HTTP 429 si se alcanza el límite, recortando la lista al disponible restante.
- `campanas_activas` → verificado al crear una nueva campaña (no en `guardar-contactos`).
- `seguimientos` → controla cuántos registros de follow-up se crean por contacto en `enviar-campana`. Si el plan es `free` (seguimientos: 0), no se insertan filas en `seguimientos`.

El campo `plan` se lee de `perfiles` en cada petición protegida; se actualiza vía `stripe/webhook` cuando Stripe confirma un pago o cancelación.

---

## Lógica de programación de seguimientos

Al enviar un email en `POST /api/enviar-campana`, por cada contacto enviado correctamente se crean tantos registros en `seguimientos` como días haya en `campana.dias_seguimiento`:

```
dias_seguimiento (default [3, 7, 14])
  → seguimiento #1: fecha_programada = hoy + 3 días
  → seguimiento #2: fecha_programada = hoy + 7 días
  → seguimiento #3: fecha_programada = hoy + 14 días
```

Cada registro se crea con `estado: 'pendiente'` y sin `asunto`/`cuerpo` (se generan en el momento del disparo, no al crear).

**Cómo se ejecutan:**
`POST /api/seguimientos` es llamado periódicamente (cron externo o botón manual en el dashboard). Filtra `seguimientos WHERE estado='pendiente' AND fecha_programada <= NOW()`. Para cada uno:
1. Si el contacto ya `respondió` → `estado: 'cancelado'` (no se molesta al lead).
2. Si falta `asunto`/`cuerpo` → `generarEmailSeguimiento()` con el email original como contexto.
3. Envía con Resend, marca `estado: 'enviado'`, actualiza `contacto.numero_seguimiento`.

El contenido se guarda en el registro `seguimientos` antes del envío para poder reintentarlo si Resend falla.

---

## Decisiones arquitectónicas

### Kanban sin drag-and-drop externo
El pipeline Kanban se implementa con estado React y `mousedown`/`mousemove`/`mouseup` nativos, sin react-beautiful-dnd ni @dnd-kit. Motivo: esas librerías añaden >40 KB al bundle y tienen problemas con React 18 Concurrent Mode. Con 6 etapas fijas y pocas tarjetas simultáneas, el coste de mantener el DnD propio es bajo.

### Gráficos SVG sin Recharts
Los gráficos del dashboard (barras de apertura/envío, línea de actividad) se renderizan con SVG calculado en servidor. Recharts pesa ~120 KB gzipped y requiere `'use client'`, lo que impide el streaming SSR. Con métricas simples (4-5 series) el SVG manual es suficiente y no bloquea el LCP.

### `supabaseAdmin` en el pixel endpoint
Como se explica en la sección de tracking: el cliente de correo no envía cookies de sesión. Usar el cliente anon devolvería un error 401. El service role key es la única opción viable; está restringido al backend y nunca se expone al cliente.

### Generación lazy del contenido de seguimientos
El `asunto`/`cuerpo` de cada seguimiento se genera con Claude en el momento del disparo (`/api/seguimientos`), no al crear la campaña. Esto evita gastar tokens en follow-ups que nunca se enviarán (porque el contacto responde antes) y permite que Claude use el email original como contexto real.

### Modelo de prompts intercambiable
`generarEmailProspeccion()` busca primero un archivo en `/prompts/email-prospeccion.md`. Si existe, lo usa como plantilla (con `{{nombre}}`, `{{cargo}}`, etc. como variables). Si no existe, usa el prompt hardcoded. Esto permite que cada instalación o cliente personalice el estilo del email sin tocar código.
