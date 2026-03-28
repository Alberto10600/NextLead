# Modelo de costes — Arrivo

## Costes variables por 1.000 emails enviados

Este es el escenario de referencia: **1.000 emails iniciales + 1.500 follow-ups** (asumiendo 1,5 seguimientos promedio por contacto antes de respuesta o cancelación = 2.500 emails totales).

### Claude Haiku (`claude-haiku-4-5-20251001`)

Precio: **$0.80 por millón de tokens de entrada / $4.00 por millón de tokens de salida**

| Operación | Tokens aprox. | Llamadas | Coste estimado |
|---|---|---|---|
| Generación de emails (`generarEmailProspeccion`) | ~400 input + ~150 output por email | 1.000 | $0.32 input + $0.60 output = **$0.92** |
| Análisis de empresa (`analizarEmpresa`) | ~450 input + ~150 output por dominio | ~250 dominios | $0.09 input + $0.15 output = **$0.24** |
| Generación de dominios (`generarDominiosPorSector`) | ~80 input + ~100 output por batch de 15 | ~17 batches | $0.001 input + $0.002 output = **~$0.003** |
| Follow-ups (`generarEmailSeguimiento`) | ~400 input + ~150 output por seguimiento | 1.500 | $0.48 input + $0.90 output = **$1.38** |
| **TOTAL Claude** | | | **~$2.54** |

> Nota: los tokens de output de Haiku cuestan 5x más que los de input, por lo que el cuerpo del email (más largo) domina el coste. Los batches de dominios son marginales.

### Resend

Plan Pro: **$20/mes para 50.000 emails** → $0.0004 por email.

| Concepto | Cantidad | Coste |
|---|---|---|
| Emails iniciales | 1.000 | $0.40 |
| Follow-ups | 1.500 | $0.60 |
| **TOTAL Resend** | 2.500 emails | **$1.00** |

### Hunter.io

Plan Growth: **$104/mes para 5.000 créditos**.

Para obtener 1.000 contactos con datos completos:
- Domain-search sobre ~250 dominios (media 4 contactos/dominio) = **250 créditos**
- Cada crédito cuesta $104 / 5.000 = $0.0208
- 250 créditos × $0.0208 = **$5.20**

> Hunter es el mayor coste variable del sistema. Si los dominios tienen más emails por dominio (empresas grandes), el número de requests baja y el coste mejora. Si se usan dominios pequeños (1-2 emails), sube.

### Supabase Pro

**$25/mes fijos**. Coste por cliente activo (asumiendo 50 clientes activos):

$25 / 50 = **$0.50 por cliente**

### Vercel Pro

**$20/mes fijos**. Coste por cliente activo (asumiendo 50 clientes activos):

$20 / 50 = **$0.40 por cliente**

---

### Total optimizado por 1.000 emails enviados

| Servicio | Coste |
|---|---|
| Claude Haiku (generación + follow-ups) | $2.54 |
| Resend (2.500 emails totales) | $1.00 |
| Hunter.io (250 requests para 1.000 contactos) | $5.20 |
| Supabase Pro (prorrateado a 50 clientes) | $0.50 |
| Vercel Pro (prorrateado a 50 clientes) | $0.40 |
| Stripe (fees sobre suscripción, no por envío) | — |
| **TOTAL** | **~$9.64** |
| **Con margen de error +18% (picos, reintentos)** | **~$11.37** |

---

## Tabla de márgenes por plan

Los precios están en euros; los costes variables en dólares. A efectos del cálculo se usa paridad ~1:1 (ajustar si el EUR/USD varía significativamente).

| Plan | Precio mensual | Contactos/mes incluidos | Coste variable estimado | Margen bruto | Margen % |
|---|---|---|---|---|---|
| Free | €0 | 100 | ~$1.14 (100 contactos × $11.37/1K) | -€1.14 | **Pérdida** |
| Starter | €29 | 500 | ~$5.69 (500 contactos × $11.37/1K) | ~€23 | **~79%** |
| Pro | €79 | 2.000 | ~$22.74 (2.000 contactos × $11.37/1K) | ~€56 | **~71%** |
| Business | €199 | 10.000 | ~$113.70 (10.000 contactos × $11.37/1K) | ~€85 | **~43%** |

> El margen del plan Business cae porque Hunter escala linealmente con los contactos. A 10.000 contactos se consumen ~2.500 créditos Hunter ($52) solo en ese cliente. Si un cliente Business usa todos los contactos del plan, el coste Hunter por sí solo absorbe el 26% del ingreso.

---

## Optimizaciones de coste ya aplicadas

### Claude Haiku en lugar de Sonnet: ahorro ~40%

La primera versión del sistema usaba `claude-sonnet-4-5` para la generación de emails. La migración a `claude-haiku-4-5-20251001` (configurable vía `EMAIL_GENERATION_MODEL`) redujo el coste de Claude en aproximadamente un 40%:

| Modelo | Input ($/M tokens) | Output ($/M tokens) | Coste estimado por 1K emails |
|---|---|---|---|
| Claude Sonnet 4.5 | $3.00 | $15.00 | ~$9.75 |
| Claude Haiku 4.5 | $0.80 | $4.00 | ~$2.54 |
| **Ahorro** | | | **~$7.21 (-74%)** |

La calidad del copy B2B generado por Haiku es suficiente para prospección fría. La diferencia de calidad se mitiga con el archivo de skill `/prompts/email-prospeccion.md` que guía el modelo con instrucciones muy específicas.

### Generación lazy de follow-ups

Los `asunto`/`cuerpo` de los seguimientos se generan con Claude solo cuando se van a enviar (no al crear la campaña). Esto evita gastar tokens en follow-ups cancelados porque el contacto respondió antes. En un funnel típico con 30% de respuesta en el primer email, se ahorran ~300 llamadas a Claude por cada 1.000 enviados.

### Paginación inteligente en Hunter

`buscarTodosLosContactos()` detecta automáticamente el límite del plan (10 resultados por página en el plan gratuito, 100 en planes de pago) y adapta la paginación. Esto evita requests fallidos que también consumen créditos en algunos planes de Hunter.

### `historial_contactos` para evitar re-contactar

Tras cada envío se hace un upsert en `historial_contactos` con clave `(user_id, email)`. Esto evita que el mismo email se añada a dos campañas distintas y se gasten créditos Hunter y tokens Claude en generar un email que sería duplicado.

---

## Análisis de break-even por coste de infraestructura

Costes fijos mensuales totales:

| Servicio | Coste fijo/mes |
|---|---|
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| Hunter.io Growth | $104 |
| Resend Pro | $20 |
| **Total fijo** | **$169/mes** |

Break-even por número de clientes de pago (sin contar costes variables):

| Escenario | Ingresos necesarios | Clientes Starter (€29) | Clientes Pro (€79) | Clientes Business (€199) |
|---|---|---|---|---|
| Cubrir Supabase + Vercel ($45) | €45 | 2 | 1 | 1 |
| Cubrir Hunter + Resend ($124) | €124 | 5 | 2 | 1 |
| Cubrir toda la infra fija ($169) | €169 | **6 clientes Starter** | **3 clientes Pro** | **1 cliente Business** |

Con 20 clientes Starter (€580/mes) la infra fija queda cubierta y el 71% restante es margen operativo antes de costes variables de uso.

---

## Hunter.io: el mayor coste variable

Hunter representa **~$5.20 de los $9.64** de coste por 1.000 contactos (54%). Es el factor más crítico a escala.

**Opciones para reducirlo:**

1. **Caché de dominios**: Si un dominio ya fue consultado por otro usuario de Arrivo, reutilizar los contactos encontrados. Requiere un modelo de datos compartido y consideraciones de privacidad.
2. **Cobrar créditos Hunter por separado**: Ofrecer un plan sin Hunter incluido (el usuario conecta su propia API key) para segmentos avanzados.
3. **Límite de contactos por dominio**: El parámetro `maxPorDominio` de `buscarTodosLosContactos()` ya existe. Activarlo por defecto a 5-10 contactos/dominio puede reducir los créditos Hunter en un 40-60% en dominios grandes, con poco impacto en la calidad de la lista.
4. **Repricing del plan Business**: A 10.000 contactos el margen cae al 43%. Subir Business a €299 llevaría el margen al ~62%, comparable al plan Pro.

---

## Recomendaciones de pricing a escala

| Situación | Recomendación |
|---|---|
| < 20 clientes de pago | Normal. Los costes fijos son la principal presión. Objetivo: llegar a 6 clientes Starter. |
| 20–100 clientes | Hunter empieza a ser material. Revisar si el plan Hunter Growth (5K créditos) sigue siendo suficiente o hay que subir a Business ($374/mes, 50K créditos). |
| > 100 clientes | Negociar con Hunter un plan enterprise o API key por usuario. Considerar subir el precio del plan Business a €299 para mantener margen > 60%. |
| Un cliente Business usa todos sus 10K contactos/mes | Coste variable solo para ese cliente: ~$114. Margen: ~€85. Rentable pero ajustado. Si dos clientes Business hacen esto simultáneamente, revisar el tier de Hunter. |

---

## Alertas de coste a configurar

| Servicio | Alerta | Umbral |
|---|---|---|
| Anthropic | Gasto diario en Claude | > $10/día (indica loop o abuso) |
| Anthropic | Gasto mensual acumulado | > $150/mes |
| Hunter.io | Créditos consumidos | > 80% del plan (4.000/5.000 créditos) |
| Resend | Emails enviados en el mes | > 40.000 (80% del plan Pro) |
| Supabase | Tamaño de la base de datos | > 4 GB (80% del límite Pro) |
| Vercel | Invocaciones de funciones | > 800K/mes (80% del límite Pro) |
| Stripe | Chargebacks | > 0 (cualquier disputa de pago) |

Las alertas de Anthropic y Hunter son las más importantes porque sus costes escalan con el uso y no tienen techo en los planes actuales.
