# NextLead — Paper Comercial

**Plataforma SaaS de prospección B2B con inteligencia artificial para agencias de marketing en España.**

---

## El problema

Las agencias de marketing en España pierden cada semana decenas de horas en tareas de prospección manual. Buscar contactos cualificados, encontrar emails verificados, redactar mensajes personalizados y hacer seguimiento de cada oportunidad son procesos tediosos que consumen recursos y ralentizan el crecimiento comercial.

- **Prospección manual ineficiente:** Localizar contactos B2B relevantes requiere navegar múltiples fuentes, copiar datos y verificar información a mano.
- **Coste elevado por lead:** El tiempo invertido en encontrar y contactar prospectos encarece el coste de adquisición de cada cliente potencial.
- **Emails genéricos que no convierten:** Los mensajes masivos y poco personalizados terminan en la bandeja de spam o son ignorados.
- **Seguimiento inconsistente:** Sin un sistema automatizado, los follow-ups se olvidan y las oportunidades se pierden.

---

## La solución: NextLead

NextLead es una plataforma SaaS diseñada específicamente para agencias de marketing españolas que necesitan generar oportunidades B2B de forma escalable y profesional.

Integra búsqueda de contactos verificados, generación de emails personalizados con inteligencia artificial y gestión completa de campañas de prospección en una sola herramienta. Todo desde un panel centralizado, en español, y con planes adaptados al tamaño de cada agencia.

---

## Funcionalidades actuales

### 1. Búsqueda de contactos por dominio

NextLead se conecta directamente con la API de Hunter.io para extraer todos los contactos profesionales asociados a un dominio empresarial. Basta con pegar una lista de dominios (uno por línea, separados por comas o URLs completas) y el sistema busca automáticamente nombres, cargos, emails verificados y perfiles de LinkedIn. La paginación automática garantiza que se recuperen todos los contactos disponibles, no solo los primeros resultados, adaptándose inteligentemente al tipo de plan de Hunter del usuario.

**Valor para tu agencia:** En segundos obtienes contactos reales y verificados de las empresas que te interesan, eliminando horas de búsqueda manual en LinkedIn o directorios web.

### 2. Tabla de contactos con filtros inteligentes

Todos los contactos encontrados se organizan en una tabla interactiva con tres vistas: Todos, Decision Makers y Genéricos. El sistema clasifica automáticamente a los contactos según su cargo (CEO, Director, Founder, Manager, etc.) y detecta emails genéricos (info@, contact@, hello@, etc.) para que puedas priorizar los contactos con poder de decisión. Incluye buscador por nombre, empresa, cargo o email, paginación de 50 contactos por página y la posibilidad de excluir contactos no relevantes antes de lanzar la campaña.

**Valor para tu agencia:** Priorizas automáticamente a quienes toman las decisiones y descartas los emails genéricos que raramente responden, mejorando tu tasa de conversión desde el primer contacto.

### 3. Generación de emails con inteligencia artificial

El motor de IA de NextLead utiliza Claude (Anthropic) para redactar emails de prospección personalizados para cada contacto. Antes de generar el email, el sistema scrapea la web de la empresa del prospecto para obtener contexto real. Cada mensaje se adapta al nombre, cargo, empresa y sector del contacto, siguiendo una estructura probada: gancho personalizado, dolor del sector, puente con la solución de tu agencia y una pregunta de cierre que invite a responder. El tono es cercano y directo, evitando expresiones corporativas y frases de email masivo.

**Valor para tu agencia:** Cada prospecto recibe un email que parece escrito a mano, con referencias concretas a su empresa y sector. Esto multiplica las tasas de respuesta frente a los templates genéricos tradicionales.

### 4. Envío de campañas

Desde la vista de detalle de cada campaña, puedes lanzar el envío con un solo clic. El sistema procesa únicamente los contactos que tienen email generado y están en estado pendiente, actualizando su estado a "enviado" y registrando la fecha de envío. Actualmente funciona en modo test (los contactos se marcan como enviados sin envío real de email), con la integración de Resend planificada para el envío real.

**Valor para tu agencia:** El flujo completo desde la búsqueda hasta el envío está integrado en una sola herramienta, eliminando la necesidad de exportar datos a plataformas externas.

### 5. Seguimientos automáticos programados

Al enviar una campaña, NextLead programa automáticamente hasta 3 seguimientos (follow-ups) por contacto, a los 3, 7 y 14 días. Cada seguimiento se registra en base de datos con su fecha programada y estado. El sistema de IA genera follow-ups con un enfoque diferente al email original, más breves y no insistentes, para maximizar la probabilidad de respuesta sin resultar molestos.

**Valor para tu agencia:** Los seguimientos son responsables de hasta el 80% de las respuestas en prospección B2B. NextLead los automatiza para que ninguna oportunidad se pierda por falta de persistencia.

### 6. Exportación CSV

La tabla de contactos incluye un botón de descarga CSV que exporta todos los contactos filtrados (según la vista y búsqueda activa) con los campos: Empresa, Nombre, Apellido, Cargo, Email, Dominio, LinkedIn y Estado. El archivo se genera con codificación UTF-8 y BOM para compatibilidad con Excel en español.

**Valor para tu agencia:** Puedes integrar los datos de NextLead con tu CRM, hojas de cálculo o cualquier otra herramienta de tu stack comercial sin fricciones.

### 7. Panel de métricas (Dashboard)

El dashboard principal muestra un resumen en tiempo real de la actividad comercial: campañas activas, emails enviados, tasa de apertura (con porcentaje calculado) y total de respuestas con su tasa correspondiente. Debajo, una tabla lista las 5 campañas más recientes con su nombre, sector, estado (borrador, procesando, activa, pausada o completada), número de enviados y fecha de creación.

**Valor para tu agencia:** Una vista clara y unificada del rendimiento de todas tus campañas de prospección, sin necesidad de montar dashboards manuales ni cruzar datos entre herramientas.

### 8. Gestión de perfil y planes

Desde la sección de perfil, cada usuario puede gestionar sus datos personales (nombre y nombre de agencia), visualizar su plan actual con los límites específicos (contactos/mes, campañas activas y follow-ups automáticos), cambiar su contraseña y acceder al portal de Stripe para gestionar su suscripción o actualizar de plan.

**Valor para tu agencia:** Control total sobre tu cuenta y suscripción sin depender de soporte. Sabes exactamente qué incluye tu plan y cuántos recursos tienes disponibles.

### 9. Sistema de skills/prompts editables para emails

NextLead utiliza un sistema de prompts estructurados (skills) almacenados como archivos Markdown editables. El prompt de prospección define con precisión la estructura del email (gancho, dolor, puente, CTA), las reglas de tono, el límite de palabras, las restricciones de formato y una lista explícita de palabras prohibidas. Si el archivo de skill existe, se usa como plantilla; si no, el sistema recurre a un prompt por defecto integrado en el código.

**Valor para tu agencia:** Puedes personalizar el estilo y la estrategia de redacción de los emails generados por IA para alinearlos con la voz y el enfoque comercial de tu agencia, sin necesidad de modificar código.

---

## Planes y precios

| | **Free** | **Starter** | **Pro** | **Business** |
|---|---|---|---|---|
| **Precio** | Gratis | 29 EUR/mes | 79 EUR/mes | 199 EUR/mes |
| **Contactos/mes** | 100 | 500 | 2.000 | 10.000 |
| **Campañas activas** | 1 | 3 | 10 | Ilimitadas |
| **Follow-ups automáticos** | -- | 1 | 3 | 5 |

- Sin permanencia. Cancela cuando quieras.
- El plan Pro es el más popular entre agencias de marketing de tamaño medio.
- El plan Business está diseñado para agencias con equipos comerciales amplios o múltiples clientes.

---

## Por qué NextLead

- **Todo en uno:** Búsqueda de contactos, generación de emails con IA, envío de campañas y seguimientos automáticos en una sola plataforma.
- **Emails que no parecen masivos:** La IA genera mensajes personalizados por contacto, con contexto real scrapeado de la web de cada empresa.
- **Foco en Decision Makers:** Clasificación automática de contactos por cargo para que tus emails lleguen a quienes toman las decisiones.
- **Diseñado para agencias españolas:** Interfaz, prompts y tono completamente en español, pensado para el mercado B2B de España y LATAM.
- **Escalable desde el día uno:** Desde 100 contactos gratuitos hasta 10.000 contactos/mes en el plan Business, con campañas ilimitadas.
- **Datos verificados:** Integración directa con Hunter.io para emails profesionales reales, no bases de datos desactualizadas.
- **Seguimientos que no se olvidan:** Programación automática de hasta 5 follow-ups, responsables de la mayoría de respuestas en prospección B2B.
- **Exportable y compatible:** Descarga CSV con todos los campos para integrar con tu CRM o herramientas existentes.

---

## Próximas funcionalidades

- **Envío real de emails con Resend:** Integración completa para enviar campañas desde tu propio dominio con tracking de aperturas y clics.
- **Pagos con Stripe:** Activación del flujo de checkout y gestión de suscripciones para los planes de pago.
- **Descubrimiento de empresas por sector:** Búsqueda avanzada de empresas objetivo filtradas por industria, país y tamaño a través de la API de Hunter.io (infraestructura ya implementada).
- **Tracking de aperturas y respuestas:** Métricas en tiempo real de cada email enviado para optimizar campañas de forma continua.

---

*NextLead -- Prospección B2B inteligente para agencias de marketing.*
