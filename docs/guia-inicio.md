# Guía de inicio — Arrivo

Bienvenido a Arrivo, la herramienta de prospección B2B diseñada para agencias de marketing. Esta guía te lleva desde el registro hasta tu primera campaña enviada, paso a paso.

---

## 1. Primeros pasos (onboarding)

### Completa tu perfil

Antes de crear tu primera campaña, ve a **Perfil** (última opción del menú lateral) y rellena:

- **Nombre** — tu nombre personal.
- **Nombre de agencia** — el nombre comercial de tu agencia. Aparecerá en los textos generados por IA.

Haz clic en **Guardar cambios** cuando termines.

### Entiende los límites de tu plan

Cada plan define cuántos contactos puedes añadir al mes, cuántas campañas puedes tener activas a la vez y cuántos follow-ups automáticos se incluyen.

| Plan     | Precio     | Contactos/mes | Campañas activas | Follow-ups auto |
|----------|------------|---------------|------------------|-----------------|
| Free     | Gratis     | 100           | 1                | —               |
| Starter  | €29/mes    | 500           | 3                | 1               |
| Pro      | €79/mes    | 2.000         | 10               | 3               |
| Business | €199/mes   | 10.000        | Ilimitadas       | 5               |

Para actualizar o gestionar tu suscripción, ve a **Perfil → Plan actual → Actualizar plan** (o **Gestionar suscripción** si ya tienes un plan de pago).

### Navegación general

El menú lateral te da acceso a todas las secciones:

- **Dashboard** — resumen general de actividad.
- **Campañas** — donde se crea y gestiona todo.
- **Contactos** — vista global de todos los contactos de todas tus campañas.
- **Seguimientos** — bandeja de follow-ups pendientes de envío.
- **Plantillas** — pitches reutilizables por sector o caso de uso.
- **Pipeline** — tablero kanban con las oportunidades que han respondido.
- **Perfil** — datos personales, plan y contraseña.

---

## 2. Crear tu primera campaña

1. Ve a **Campañas** en el menú lateral.
2. Haz clic en **Nueva campaña**.
3. Escribe el **nombre de la campaña** (por ejemplo, "Ecommerce España Q2").
4. Confirma. Se abrirá automáticamente la página de detalle de la campaña.

La campaña empieza en estado **Borrador**. Irá cambiando a medida que añadas contactos, generes emails y envíes.

---

## 3. Buscar contactos

Arrivo encuentra contactos reales a través de Hunter.io. Hay dos modos de búsqueda.

### Modo por sector (recomendado para empezar)

Este modo usa IA (Claude) para generar una lista de empresas relevantes antes de buscar sus contactos.

1. En la página de la campaña, selecciona la pestaña **Por sector**.
2. Rellena los campos:
   - **Sector** — elige de la lista o escribe uno (p. ej. "Ecommerce / Retail Online").
   - **País** — selecciona el país objetivo (España, México, Argentina, etc.).
   - **Región** (opcional) — ciudad o comunidad autónoma para afinar la búsqueda.
3. Haz clic en **Generar empresas con IA**. La IA generará hasta 15 dominios de empresas que encajan con tu criterio.
4. Revisa la lista de dominios sugeridos. Todos vienen marcados por defecto; desmarca los que no te interesen.
5. Ajusta **Contactos por empresa** (recomendado: 2–3).
6. Haz clic en **Buscar contactos**. Arrivo consultará Hunter.io para enriquecer los dominios seleccionados.

### Modo por dominio

Si ya tienes una lista de empresas identificadas:

1. Selecciona la pestaña **Por dominio**.
2. Pega los dominios en el campo de texto, uno por línea (p. ej. `empresa.com`). También se aceptan URLs completas; el sistema extrae el dominio automáticamente.
3. Ajusta **Contactos por empresa** y haz clic en **Buscar contactos**.

### Panel de filtros (Capa 2)

Después de la búsqueda, antes de guardar nada, aparece el panel de filtros:

- **Excluir emails genéricos** — activado por defecto. Elimina direcciones como `info@`, `contact@`, `ventas@`, etc. Muy recomendable dejarlo activado.
- **Filtrar por cargo** — escribe palabras clave separadas por comas (p. ej. `director, ceo, founder`). Solo se guardarán contactos cuyo cargo contenga alguna de esas palabras.

Cuando estés conforme con la previsualización, haz clic en **Guardar X contactos**. Los contactos quedan vinculados a la campaña y aparecen en la tabla.

> Si tu plan no tiene capacidad suficiente para todos los contactos encontrados, el sistema guarda los que caben y pone el resto en cola para el próximo mes.

---

## 4. Generar emails con IA

Una vez guardados los contactos, es hora de redactar los emails de prospección. Arrivo genera un email personalizado para cada contacto usando Claude.

1. Haz clic en el botón **Generar emails IA · N** (la N indica cuántos contactos aún no tienen email).
2. Se abre el panel de generación. Rellena:
   - **Descripción de tu agencia** — explica qué hace tu agencia, para quién y qué resultado consigues. Cuanto más específico, mejor será el email generado. Ejemplo: *"Somos una agencia especializada en SEO y SEM para tiendas online. Ayudamos a duplicar las ventas orgánicas en 6 meses con estrategias de contenido y conversión."*
   - **Sector objetivo** — el sector al que te diriges en esta campaña.
   - **Tono** — elige entre:
     - **Cercano** — directo, tuteo, tono humano.
     - **Formal** — profesional, usted.
     - **Millennial** — informal y moderno.
     - **Técnico** — centrado en datos y métricas.
3. (Opcional) Carga una **Plantilla** guardada para rellenar los campos automáticamente.
4. Configura los **follow-ups automáticos**:
   - **Días de seguimiento** — cuántos días después del primer envío se mandará cada follow-up (por defecto: 3, 7, 14 días).
   - **Límite diario** — número máximo de emails enviados por día (0 = sin límite). Recomendado: 50–100 para dominios nuevos.
5. Haz clic en **Generar N emails**. El proceso tarda unos segundos por contacto. Puedes ver el progreso en tiempo real.

### Revisar y editar emails individuales

Una vez generados, haz clic en cualquier tarjeta de contacto para ver el email que se le generó. Dispones de un editor inline para modificar el asunto o el cuerpo antes de enviar.

---

## 5. Enviar la campaña

Con los emails generados, aparece el botón de envío en la barra superior.

### Test vs. Real

El botón de envío tiene dos modos que puedes alternar:

- **Test (○ Test)** — marca los emails como enviados sin enviar ningún correo real. Ideal para comprobar el flujo antes de lanzar.
- **Real (● Real)** — envía los correos electrónicos de verdad a través de Resend. Requiere tener un dominio verificado en tu cuenta de Resend.

**Recomendación:** envía siempre en modo test primero. Cuando veas que todo está correcto, cambia a modo real.

### Pasos para enviar

1. Verifica que el modo esté en la posición correcta (test o real).
2. Haz clic en **Enviar · N** (N = contactos pendientes con email generado).
3. En modo real, aparece una confirmación antes de proceder.
4. Una barra de progreso indica el estado del envío.

Si tienes un límite diario configurado, los emails que superen ese límite se encolan automáticamente para el día siguiente.

---

## 6. Seguir los resultados (Analytics)

Una vez realizados los primeros envíos, aparece el botón **Stats** en la barra superior de la campaña.

La página de estadísticas muestra:

- **Funnel de estados**: cuántos contactos están en cada fase — Pendiente → Enviado → Abierto → Respondido.
- **Gráfico de actividad diaria**: barras por día con el volumen de emails enviados, abiertos y respondidos.
- **Indicadores clave**:
  - % de apertura
  - % de respuesta
  - % de rebote

Los estados se actualizan automáticamente cuando Resend notifica aperturas o respuestas (requiere tracking activado en tu dominio de Resend).

---

## 7. Pipeline (gestión de oportunidades)

El Pipeline convierte las respuestas en oportunidades de negocio gestionables. Se llena automáticamente: cuando un contacto pasa a estado **Respondido**, aparece en la primera columna del tablero.

### Las 6 etapas del pipeline

| Etapa              | Descripción                              |
|--------------------|------------------------------------------|
| Respondió          | El contacto ha contestado al email       |
| Call agendada      | Tienes una reunión o llamada programada  |
| Propuesta enviada  | Has mandado una propuesta comercial      |
| Negociando         | Estás en proceso de negociación          |
| Cerrado ✓          | Trato ganado                             |
| Cerrado ✗          | Trato perdido                            |

### Cómo usar el tablero

- Haz clic en la **flecha derecha** de una tarjeta para avanzar al siguiente estado.
- Haz clic en la **flecha izquierda** para retroceder.
- Haz clic en **+ Añadir nota** dentro de una tarjeta para guardar información relevante sobre ese contacto (presupuesto discutido, nombre del decisor, próximos pasos, etc.).
- Usa los filtros de la barra superior para ver solo una etapa concreta.

---

## 8. Plantillas de pitch

Las plantillas te permiten guardar tu descripción de agencia, sector y tono para reutilizarlos en futuras campañas sin volver a escribirlos. Son especialmente útiles si tu agencia trabaja con varios sectores o tiene distintos servicios.

### Crear una plantilla

1. Ve a **Plantillas** en el menú lateral.
2. Haz clic en **+ Nueva plantilla**.
3. Rellena:
   - **Nombre de la plantilla** — algo descriptivo como "Pitch para Ecommerce" o "Propuesta SEO — Formal".
   - **Sector** (opcional) — para identificarla rápidamente.
   - **Descripción de tu agencia / pitch** — el texto que usará la IA para redactar los emails.
   - **Tono por defecto** — Cercano, Formal, Millennial o Técnico.
4. Haz clic en **Crear plantilla**.

### Cargar una plantilla al generar emails

En el panel de generación de emails de cualquier campaña, verás un selector de plantillas. Al seleccionar una, los campos de descripción y tono se rellenan automáticamente.

También puedes guardar una plantilla directamente desde el panel de generación: rellena los campos y haz clic en **Guardar como plantilla**.

---

## 9. Follow-ups automáticos

Los follow-ups son recordatorios automáticos que se envían a los contactos que no han respondido al primer email. El sistema genera el contenido con IA antes de cada envío.

### Cómo funcionan

- Los días de seguimiento se configuran al generar los emails (por defecto: 3, 7 y 14 días después del envío inicial).
- El número de follow-ups disponibles depende de tu plan (Starter: 1, Pro: 3, Business: 5).
- El sistema **cancela automáticamente** los follow-ups pendientes si el contacto responde o pide no ser contactado.

### Ver y gestionar follow-ups

Ve a **Seguimientos** en el menú lateral. Verás todos los follow-ups pendientes con su fecha programada. Puedes revisar el contenido generado antes de que se envíen.

---

## 10. Consejos de buenas prácticas

Estos consejos te ayudarán a obtener mejores tasas de respuesta y evitar problemas de entregabilidad desde el primer día.

**Empieza siempre en modo test.** Antes de lanzar una campaña real, envíala en modo test para verificar que los emails, asuntos y follow-ups tienen el formato correcto.

**Calienta tu dominio gradualmente.** Si tu dominio de envío es nuevo, establece un límite diario de 20–50 emails la primera semana y auméntalo progresivamente. Esto reduce el riesgo de que tu dominio aterrice en spam.

**Usa 2–3 contactos por empresa como máximo.** Contactar a muchas personas de la misma empresa a la vez puede generar bloqueos o dañar tu reputación de envío.

**Filtra por cargo desde el principio.** Palabras clave como `director, ceo, founder, gerente` te dirigen a los decisores reales y mejoran significativamente la tasa de respuesta.

**Adapta el tono al sector.** Los sectores tradicionales (legal, finanzas, salud) responden mejor al tono **Formal**. Las startups, agencias y empresas tecnológicas responden mejor a **Cercano** o **Millennial**. Usa **Técnico** si tu propuesta de valor se basa en datos o rendimiento medible.

**Sé específico en la descripción de tu agencia.** La IA no puede personalizar lo que no conoce. Cuanto más concreto seas sobre tu especialización, los resultados que consigues y el tipo de cliente al que ayudas, más relevantes serán los emails generados.

**Guarda plantillas por línea de servicio.** Si ofreces SEO, paid media y diseño web, crea una plantilla distinta para cada uno. Así cada campaña tiene un pitch afinado sin tener que reescribir nada.

**Revisa el Pipeline semanalmente.** Los contactos que responden están calientes. Avanza sus etapas, añade notas y programa llamadas mientras el interés es fresco.
