# Arrivo — Preguntas frecuentes

> Respuestas directas para agencias que están empezando a usar Arrivo o que se han encontrado con algo que no funciona como esperaban.

---

## 1. ¿Qué es Hunter.io y por qué lo necesito?

Hunter.io es el servicio que Arrivo usa para encontrar emails de contactos reales dentro de las empresas que tú eliges. Cuando introduces un dominio (por ejemplo `empresa.com`) o buscas por sector, Hunter busca en su base de datos las direcciones de email verificadas de personas que trabajan allí, junto con su nombre, cargo y departamento.

Sin Hunter, Arrivo no puede encontrar contactos. La API de Hunter está integrada directamente en la plataforma: tú no necesitas tener una cuenta en Hunter ni pagar por separado, el consumo va incluido en tu plan de Arrivo.

Lo que sí necesitas es dar a Arrivo información de partida: los dominios de las empresas que quieres prospectar, o el sector y país en que quieres buscar. Hunter hace el resto.

---

## 2. ¿Por qué mis emails no están llegando?

El motivo más habitual es que el dominio desde el que envías no está correctamente autenticado. Para que los emails lleguen a la bandeja de entrada (y no a spam o directamente no lleguen), el dominio remitente necesita tener configurados los registros **SPF** y **DKIM** en su DNS.

Arrivo envía emails a través de **Resend**. Para usar tu propio dominio tienes que verificarlo en el panel de Resend y añadir los registros DNS que te indiquen. Hasta que eso esté listo, puedes usar el modo test (que no envía emails reales) o un dominio temporal de Resend para hacer pruebas.

Lista de comprobación rápida si los emails no llegan:

- ¿Tienes el dominio verificado en Resend?
- ¿Has añadido los registros SPF y DKIM en tu proveedor de DNS (GoDaddy, Cloudflare, etc.)?
- ¿Has esperado al menos 15–30 minutos tras añadir los registros para que propaguen?
- ¿Estás en modo **real** y no en modo **test**? (en test no se envía nada)

Si el problema persiste después de esto, revisa la sección de webhooks: los rebotes se registran automáticamente y puedes verlos en el estado de cada contacto.

---

## 3. ¿Cómo funciona el tracking de aperturas?

Cuando Arrivo envía un email, incluye de forma invisible una imagen de 1×1 píxel. Cuando el destinatario abre el email y su cliente de correo carga las imágenes, esa imagen se descarga desde los servidores de Arrivo y en ese momento se registra la apertura con fecha y hora.

**Limitación importante: Apple Mail Privacy Protection (MPP).** Desde iOS 15, Apple descarga las imágenes de todos los emails automáticamente, en el momento de recibirlos, sin que el usuario los haya abierto de verdad. Esto significa que contactos con iPhone o Mac pueden aparecer como "abierto" aunque no hayan leído el email. Es una limitación del sector en general, no específica de Arrivo.

La consecuencia práctica: la tasa de apertura es un indicador orientativo, no exacto. Lo que sí es fiable es la ausencia de apertura (si no aparece como abierto, casi seguro que no lo han leído) y las respuestas directas.

---

## 4. ¿Puedo importar mi propia lista de contactos?

Actualmente no. Arrivo no tiene un importador de CSV. La forma de añadir contactos es introduciendo dominios de empresas directamente en la campaña y dejando que Hunter busque los contactos, o usando la búsqueda por sector para que la IA sugiera empresas del nicho que te interesa.

Si tienes dominios propios de empresas que ya conoces, puedes pegarlos directamente en el campo de dominios (uno por línea, o separados por comas). Arrivo parsea la URL automáticamente, así que puedes pegar URLs completas como `https://www.empresa.com/sobre-nosotros` y extraerá `empresa.com`.

La importación de CSV con contactos ya existentes es una funcionalidad en el backlog pero aún no tiene fecha.

---

## 5. ¿Cuál es la diferencia entre modo test y modo real?

Encontrarás este toggle en cada campaña antes de lanzar el envío.

- **Modo test:** los emails se generan con IA, aparecen en la tabla con su asunto y cuerpo, puedes revisarlos y editarlos, pero **no se envían a nadie**. Todo el proceso funciona excepto el envío final. Es ideal para revisar que los textos suenan bien antes de comprometer el envío real.

- **Modo real:** los emails se envían de verdad a las direcciones de los contactos usando tu dominio verificado en Resend. A partir de aquí, el tracking de aperturas, los webhooks de rebote y las secuencias de seguimiento están activos.

Recomendación: siempre haz una primera pasada en modo test con una muestra pequeña de contactos para asegurarte de que el tono y el contenido están bien. Luego cambia a modo real para el envío definitivo.

---

## 6. ¿Cómo funcionan los seguimientos automáticos?

Cuando envías un email inicial a un contacto, Arrivo puede programar automáticamente entre 1 y 5 follow-ups (según tu plan) en los días que tú configures. Por ejemplo, si tienes `[3, 7, 14]`, el primer seguimiento sale a los 3 días, el segundo a los 7 y el tercero a los 14.

Los seguimientos se generan con IA (Claude Haiku) adaptándose al contexto del contacto, igual que el email inicial pero con un tono de continuidad. Puedes editarlos antes de que se envíen si tienes el editor inline activo.

**Cancelación automática:** si un contacto responde o activas `no_contactar` en ese contacto, todos sus seguimientos pendientes se cancelan de forma inmediata. No recibirán más emails. Esto es importante para no molestar a quienes ya han respondido, aunque sea para decir que no están interesados.

Puedes cambiar los días de seguimiento en la configuración de cada campaña antes de lanzar. Una vez enviado el email inicial, los seguimientos ya están programados con los días que tenías en ese momento.

---

## 7. ¿Qué hace exactamente el estado "no_contactar"?

Es un interruptor de seguridad por contacto. Cuando marcas un contacto como `no_contactar`:

1. Se cancelan todos sus seguimientos pendientes.
2. No se le enviará ningún email futuro desde ninguna campaña tuya, aunque aparezca en una nueva búsqueda.
3. El contacto queda visible en tu lista con ese estado para que puedas ver que ya fue procesado.

Úsalo cuando un contacto te pide que no le escribas más, cuando sabes que la empresa no es un buen fit, o cuando hay un rebote grave (el sistema también puede activar esto automáticamente en caso de quejas registradas por Resend).

No es posible revertirlo desde la interfaz una vez activado, lo que es intencionado para evitar accidentes. Si necesitas reactivar un contacto, tendrás que hacerlo desde soporte.

---

## 8. ¿Cómo se cuentan los contactos mensuales?

El contador de contactos del mes se basa en la fecha de creación (`created_at`) de cada contacto en tu cuenta. El 1 de cada mes el contador vuelve a cero y puedes guardar contactos nuevos hasta el límite de tu plan.

Los límites por plan son:

| Plan | Contactos/mes | Campañas activas | Seguimientos |
|---|---|---|---|
| Free | 100 | 1 | — |
| Starter (29€/mes) | 500 | 3 | 1 |
| Pro (79€/mes) | 2.000 | 10 | 3 |
| Business (199€/mes) | 10.000 | ilimitadas | 5 |

Importante: el límite aplica al guardar contactos, no al enviar. Si tienes 450 contactos ya guardados en un plan Starter y Hunter encuentra 100 más, solo se guardarán 50 y los otros 50 quedarán en cola con el aviso correspondiente.

---

## 9. ¿Para qué sirve el Pipeline?

El Pipeline es un tablero Kanban donde aparecen automáticamente los contactos que han respondido a tus emails. Sirve para gestionar el proceso de venta una vez que el outreach ha funcionado y hay interés real.

Las 6 etapas son:

1. **Respondió** — punto de entrada automático cuando un contacto contesta.
2. **Call agendada** — has acordado una llamada de descubrimiento.
3. **Propuesta enviada** — les has mandado una propuesta o presupuesto.
4. **Negociando** — están revisando condiciones o pidiendo cambios.
5. **Cerrado ganado** — firmaron.
6. **Cerrado perdido** — no salió adelante.

Puedes mover un contacto de etapa con los botones de la tarjeta y añadir notas privadas en cada una. El Pipeline es una herramienta para no perder el hilo de los deals en curso, no un CRM completo; si necesitas integrarlo con HubSpot o Salesforce, esa funcionalidad está en el roadmap para el plan Business.

---

## 10. ¿Puedo usar mi propio dominio de email?

Sí, y es muy recomendable hacerlo. Enviar desde tu propio dominio (por ejemplo `hola@tuagencia.com`) genera mucha más confianza que un dominio genérico y mejora significativamente la tasa de entrega.

Para configurarlo:

1. Ve al panel de **Resend** (resend.com) y añade tu dominio en la sección "Domains".
2. Resend te dará unos registros DNS (SPF, DKIM y opcionalmente DMARC) que tienes que añadir en el panel de tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.).
3. Una vez verificado (puede tardar unos minutos), ya puedes usar ese dominio en Arrivo.

Si no tienes un dominio propio todavía, puedes hacer pruebas con el modo test mientras tanto.

---

## 11. ¿Qué tono debo elegir para mi campaña?

El tono afecta directamente a cómo suena el email: el vocabulario, la estructura de las frases, el nivel de formalidad. Ninguno es mejor que otro en abstracto; depende del sector al que te diriges y del perfil del contacto.

- **Cercano** — trato de tú, lenguaje natural y directo, sin tecnicismos. Funciona bien para sectores como hostelería, moda, restauración, ecommerce o startups. También en LATAM donde el trato informal es más habitual.

- **Formal** — lenguaje más cuidado y estructurado, sin tuteísmo forzado. Adecuado para sectores como servicios financieros, legal, consultoría corporativa o empresas grandes (200+ empleados).

- **Millennial** — energético, con referencias culturales más actuales y un toque de humor sutil. Funciona para agencias de marketing, empresas de software, startups de producto o cualquier contacto que tenga perfil digital.

- **Técnico** — orientado a contenido, con detalle y precisión. Para IT, desarrollo de software, ingeniería o cualquier sector donde el contacto valora los argumentos concretos sobre el storytelling.

Duda habitual: si tu agencia tiene un tono de marca muy definido, usa la descripción de agencia para matizarlo aunque elijas un tono base. El prompt de IA combina ambas cosas.

---

## 12. ¿Por qué Hunter ha encontrado 0 contactos en un dominio?

Hay varias razones posibles:

- **El dominio no tiene emails indexados en Hunter.** Hunter cubre principalmente empresas con presencia digital activa. Empresas muy pequeñas, muy locales o con dominios poco conocidos pueden no estar en su base de datos.
- **El dominio tiene una estructura de email inusual.** Hunter indexa emails que aparecen públicamente en la web (webs corporativas, LinkedIn, firmas en foros, etc.). Si la empresa usa un dominio diferente para el email (p. ej. tienen web en `empresa.com` pero sus emails son `@grupo-holding.es`), Hunter no lo encontrará por el dominio de la web.
- **El dominio usa un proveedor de email privado o tiene bloqueos.** Algunos dominios grandes tienen medidas anti-scraping activas.
- **Escribiste el dominio con www o con https.** Arrivo lo parsea automáticamente, pero comprueba que el dominio que aparece en la tabla sea `empresa.com` sin prefijos.

Si Hunter devuelve 0 constantemente para un sector entero, prueba a cambiar el país o a usar la búsqueda por sector con términos más amplios.

---

## 13. ¿Cómo funciona el límite de "contactos por empresa"?

Durante la búsqueda de contactos en una campaña, puedes configurar el máximo de personas que quieres guardar por empresa. Por defecto está en 3.

Esto es útil para evitar bombardear a toda una empresa pequeña y para distribuir mejor el cupo mensual de tu plan entre más empresas distintas. Si Hunter encuentra 8 personas en `empresa.com` pero tienes el límite en 3, solo se guardarán los 3 primeros (normalmente los de mayor seniority según Hunter).

Puedes subir este número si estás prospectando empresas grandes donde quieres llegar a varios departamentos, o bajarlo a 1 si prefieres máxima dispersión entre empresas.

---

## 14. ¿Qué pasa cuando llego al límite mensual de contactos?

Cuando guardas contactos y la operación supera el cupo restante del mes, Arrivo guarda los que caben dentro del límite y muestra un aviso con cuántos han quedado "en cola". Esos contactos en cola no se pierden: simplemente no se guardan hasta que el contador se resetee el 1 del mes siguiente o hasta que hagas upgrade de plan.

No se producen errores ni se corta el proceso bruscamente. El mensaje que verás será algo como "48 contactos guardados · 12 superan el límite del plan".

Si necesitas más capacidad de forma inmediata, puedes hacer upgrade desde la sección de cuenta. El nuevo límite se aplica de forma instantánea.

---

## 15. ¿Cómo se lee la página de analíticas?

La página de analíticas de cada campaña tiene tres secciones:

**Embudo de conversión** — muestra cuántos contactos hay en cada fase: Total → Enviados → Abiertos → Respondidos. Lo normal es que cada barra sea más pequeña que la anterior. Si los "enviados" son mucho menos que el total, tienes muchos contactos en estado pendiente (comprueba si el envío se completó). Si los "abiertos" son muy pocos respecto a enviados, revisa la línea de asunto o la hora de envío.

**Timeline de actividad** — gráfico cronológico que muestra cuándo se produjeron envíos y aperturas a lo largo del tiempo. Te ayuda a ver si hay picos de actividad en ciertos días (útil para decidir cuándo programar futuros envíos) y si hay un periodo de inactividad que sugiere que la campaña se ha "enfriado".

**Medidores (gauges SVG)** — dos medidores circulares que muestran visualmente la tasa de apertura y la tasa de respuesta en porcentaje. Son una referencia rápida del rendimiento global. Como referencia del sector: una tasa de apertura por encima del 30% es buena en outreach en frío, y una tasa de respuesta por encima del 5% es notable.

Si los números son muy bajos, las causas más frecuentes son: asunto poco atractivo, tono incorrecto para el sector, envío a cargos demasiado genéricos (prueba a filtrar mejor por cargo) o problemas de entregabilidad (revisa SPF/DKIM).
