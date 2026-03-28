# Arrivo — Product Roadmap

> Última actualización: marzo 2026

---

## ✅ Entregado (Sprint 1–3)

### Core de envío

- **Envío real de emails con Resend** — integración completa con Resend para envíos transaccionales. Toggle test/real en cada campaña para validar antes de lanzar.
- **Pixel de tracking de aperturas** — píxel 1×1 GIF servido desde `/api/track/open/[id]` con registro en base de datos vía `supabaseAdmin`. Compatible con la mayoría de clientes de email (ver limitaciones en el FAQ).
- **Generación de seguimientos con Claude antes del envío** — los follow-ups se redactan con IA antes de enviarse, adaptados al contexto del contacto y al tono de la campaña.
- **Webhooks de Resend** — procesamiento automático de eventos `bounced`, `opened` y `complained`. Los rebotes y quejas actualizan el estado del contacto para proteger la reputación del dominio remitente.

### Mejoras rápidas (quick wins)

- **Editor inline de email** — posibilidad de editar asunto y cuerpo generados por IA antes de enviar, directamente desde la tabla de contactos.
- **Persistencia del análisis web** — el campo `contexto_web` (análisis de la web del prospecto) se guarda en base de datos y no se regenera en cada visita, reduciendo llamadas a la API.
- **Opt-out por contacto** — estado `no_contactar` que detiene cualquier envío futuro a ese contacto y cancela sus seguimientos pendientes.
- **Columna de sector en tabla de contactos** — el sector del prospecto es visible directamente en la vista de contactos sin tener que abrir la campaña.
- **Exportación CSV mejorada** — incluye sector, fechas de envío y apertura, y estado actual del contacto.

### Funcionalidades

- **Secuencias de seguimiento configurables** — array `dias_seguimiento` editable por campaña (p. ej. `[3, 7, 14]`). Cada campaña puede tener su propio ritmo.
- **Tono por campaña** — cuatro tonos seleccionables: `cercano`, `formal`, `millennial`, `técnico`. Afecta al prompt de generación de Claude.
- **Sistema de plantillas** — página de Plantillas con CRUD completo. Las plantillas guardan descripción de agencia, sector objetivo y tono para reutilizarlas entre campañas.
- **Throttling diario de envíos** — campo `limite_diario` por campaña para no superar un número máximo de envíos por día y evitar picos que puedan afectar a la reputación del dominio.
- **Filtro por región geográfica** — en la búsqueda por sector, campo de región para acotar resultados a comunidades autónomas, estados o ciudades concretas.
- **Página de analíticas de campaña** — embudo de conversión (contactos → enviados → abiertos → respondidos), timeline de actividad y medidores SVG con tasas de apertura y respuesta.

### Calidad y controles

- **Pipeline Kanban** — vista de oportunidades en 6 etapas: Respondió → Call agendada → Propuesta enviada → Negociando → Cerrado ganado → Cerrado perdido. Drag-free con botones de avance/retroceso y notas por tarjeta.
- **Filtro de calidad de contactos en 3 capas:**
  - Capa 1: límite máximo de contactos por dominio (`max_por_dominio`).
  - Capa 2: filtro de cargo por palabras clave antes de guardar (pre-save), con opción de excluir emails genéricos (info@, contact@, etc.).
  - Capa 3: selección manual de dominios sugeridos por IA mediante checkboxes.
- **Límites mensuales de contactos por plan** — aplicados en `guardar-contactos`. Los contactos que superen el cupo del plan se registran como `en_cola` y no se guardan hasta el siguiente ciclo.
- **Optimización con Haiku para follow-ups** — los seguimientos usan Claude Haiku en lugar de Sonnet, reduciendo el coste de generación IA aproximadamente un 40%.

---

## 🔄 En standby

- **Exclusión de keywords en búsqueda de dominios** — filtrado de dominios por palabras clave no deseadas durante la fase de sugerencia (Patrón 1 identificado en simulación). Deprioritizado por baja demanda respecto a otras funcionalidades.

---

## 📋 Backlog priorizado

> La priorización se basa en una simulación con 10 agencias reales que identificó los patrones de uso más frecuentes, los puntos de fricción más habituales y las funcionalidades que más impacto tendrían en la tasa de cierre y en la retención. Las prioridades reflejan ese análisis.

### Alta prioridad

| Funcionalidad | Razonamiento |
|---|---|
| **Drill-down analítico por contacto** — ver desde el embudo quién específicamente abrió el email, cuántas veces y cuándo. | La simulación mostró que los agentes quieren actuar sobre los datos del embudo, no solo verlos. Sin drill-down, la analítica es informativa pero no accionable. |
| **Detección de respuesta y flagging de leads calientes** — marcar automáticamente como "lead caliente" a los contactos que abren 2 o más veces sin responder. | El patrón de doble apertura es el indicador más fiable de interés real antes de una respuesta. Permite priorizar llamadas manuales. |

### Prioridad media

| Funcionalidad | Razonamiento |
|---|---|
| **Kit de cumplimiento (LOPD)** — footer de opt-out conforme al RGPD, CSV de auditoría con el cuerpo del email enviado y timestamp. | Varios agentes en la simulación operan en sectores regulados (salud, finanzas, educación) y necesitan poder demostrar el consentimiento. |
| **Clonación de campañas** — duplicar una campaña existente con todos sus ajustes (tono, secuencia, límites). | Flujo solicitado por el 7 de 10 agencias en la simulación. Las agencias reutilizan la misma estructura con distintos segmentos de sector. |
| **Sistema de notificaciones** — alerta por email o WhatsApp cuando un contacto abre el email o responde. | Permite cerrar el bucle de ventas más rápido. En la simulación, los agentes perdían oportunidades por no enterarse de las aperturas a tiempo. |
| **Horario programado de envíos** — enviar la campaña en un día y hora concretos (p. ej. martes a las 10:00). | Las tasas de apertura varían significativamente según el día y la franja horaria. Los agentes con más experiencia lo piden como condición para confiar el envío a la plataforma. |

### Baja prioridad

| Funcionalidad | Razonamiento |
|---|---|
| **Multi-sender por campaña** — asociar varios dominios remitentes a una misma campaña para distribuir el volumen. | Útil para agencias con alto volumen, pero requiere gestión de múltiples dominios en Resend. Baja demanda en el segmento actual. |
| **Integración CRM (HubSpot / Salesforce via webhook)** — sincronizar contactos y estados de pipeline con CRM externo. Exclusivo plan Business. | Alta complejidad de implementación. Solo justificado para el segmento enterprise. |
| **Gestión multi-usuario / seats** — invitar a miembros del equipo con roles y permisos diferenciados. | Necesario para escalar a agencias medianas y grandes, pero irrelevante para el perfil solopreneur/agencia pequeña que es el ICP actual. |
