import Link from 'next/link'

export const metadata = {
  title: 'Legal — Arrivo',
  description: 'Política de privacidad y términos y condiciones de Arrivo',
}

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900">
            Arr<span className="text-orange-500">ivo</span>
          </span>
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Volver
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Index */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Aviso Legal y Privacidad</h1>
          <p className="text-sm text-gray-500 mb-6">Última actualización: marzo 2025</p>
          <div className="flex flex-col gap-1.5 text-sm">
            <a href="#privacidad" className="text-orange-500 hover:underline">1. Política de Privacidad</a>
            <a href="#terminos" className="text-orange-500 hover:underline">2. Términos y Condiciones</a>
            <a href="#cookies" className="text-orange-500 hover:underline">3. Política de Cookies</a>
          </div>
        </div>

        {/* Privacy Policy */}
        <section id="privacidad" className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3">
            1. Política de Privacidad
          </h2>

          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1.1 Responsable del tratamiento</h3>
              <p>
                El responsable del tratamiento de los datos personales recogidos a través de Arrivo es la
                entidad titular del servicio (en adelante, <strong>&ldquo;Arrivo&rdquo;</strong>). Para cualquier consulta
                relacionada con la privacidad, puede contactar en: <strong>privacidad@arrivo.es</strong>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1.2 Datos que recopilamos</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Datos de cuenta:</strong> nombre, email y contraseña (encriptada) al registrarse.</li>
                <li><strong>Datos de uso:</strong> campañas creadas, contactos gestionados, emails enviados, aperturas y respuestas.</li>
                <li><strong>Datos de pago:</strong> gestionados exclusivamente por Stripe. Arrivo no almacena datos de tarjetas.</li>
                <li><strong>Datos de contactos prospectados:</strong> nombre, email, empresa y cargo de terceros obtenidos mediante la integración con Hunter.io u otras fuentes públicas.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1.3 Finalidad y base legal</h3>
              <p className="mb-2">Tratamos sus datos para:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Prestar el servicio de automatización de prospección B2B (ejecución contractual, art. 6.1.b RGPD).</li>
                <li>Cumplir con obligaciones legales y fiscales (art. 6.1.c RGPD).</li>
                <li>Enviar comunicaciones sobre actualizaciones del servicio, previo consentimiento (art. 6.1.a RGPD).</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1.4 Conservación de datos</h3>
              <p>
                Los datos se conservan mientras la cuenta esté activa. Al cancelar la suscripción, los datos
                se eliminan en un plazo máximo de 90 días, salvo obligación legal de conservación.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1.5 Destinatarios</h3>
              <p className="mb-2">Sus datos pueden ser compartidos con proveedores necesarios para prestar el servicio:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Supabase:</strong> base de datos y autenticación (EE.UU. — DPA disponible).</li>
                <li><strong>Resend:</strong> envío de emails transaccionales (EE.UU.).</li>
                <li><strong>Stripe:</strong> procesamiento de pagos (EE.UU.).</li>
                <li><strong>Anthropic:</strong> generación de contenido mediante IA (EE.UU.).</li>
                <li><strong>Hunter.io:</strong> enriquecimiento de contactos (Francia/EE.UU.).</li>
              </ul>
              <p className="mt-2">Todos los proveedores están sujetos a contratos de tratamiento de datos conforme al RGPD.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1.6 Sus derechos</h3>
              <p className="mb-2">
                De acuerdo con el RGPD (Reglamento UE 2016/679) y la LOPDGDD (Ley Orgánica 3/2018), usted tiene derecho a:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Acceso:</strong> conocer qué datos tenemos sobre usted.</li>
                <li><strong>Rectificación:</strong> corregir datos incorrectos.</li>
                <li><strong>Supresión:</strong> solicitar el borrado de sus datos (&ldquo;derecho al olvido&rdquo;).</li>
                <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado.</li>
                <li><strong>Oposición:</strong> oponerse al tratamiento en determinadas circunstancias.</li>
                <li><strong>Limitación:</strong> solicitar la restricción del tratamiento.</li>
              </ul>
              <p className="mt-2">
                Para ejercer estos derechos, contáctenos en <strong>privacidad@arrivo.es</strong>. También puede
                presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong>{' '}
                en <a href="https://www.aepd.es" className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">www.aepd.es</a>.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1.7 Prospección B2B y datos de terceros</h3>
              <p>
                Al usar Arrivo para contactar con empresas, el usuario actúa como responsable del tratamiento
                de los datos de los contactos que prospecta. El usuario se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-gray-600">
                <li>Incluir siempre una opción de baja en cada comunicación.</li>
                <li>Respetar las solicitudes de exclusión (opt-out) inmediatamente.</li>
                <li>Utilizar únicamente datos obtenidos de fuentes legítimas.</li>
                <li>Cumplir con la normativa aplicable (RGPD, LSSICE, CASL, CAN-SPAM según el país destino).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* T&C */}
        <section id="terminos" className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3">
            2. Términos y Condiciones
          </h2>

          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.1 Objeto del servicio</h3>
              <p>
                Arrivo es una plataforma SaaS de prospección B2B que automatiza la búsqueda de contactos,
                la redacción de emails personalizados con IA y el envío y seguimiento de campañas de outreach.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.2 Registro y cuenta</h3>
              <p>
                El uso del servicio requiere crear una cuenta con email y contraseña válidos. El usuario es
                responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada
                desde su cuenta.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.3 Planes y precios</h3>
              <p>
                Arrivo ofrece un plan gratuito y planes de pago con diferentes límites de contactos,
                campañas y seguimientos. Los precios están disponibles en <Link href="/precios" className="text-orange-500 hover:underline">/precios</Link>.
                Los pagos son gestionados por Stripe y se facturan mensualmente.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.4 Uso aceptable</h3>
              <p className="mb-2">Queda expresamente prohibido usar Arrivo para:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Envío de spam o comunicaciones no solicitadas de carácter masivo.</li>
                <li>Engañar, suplantar identidades o realizar actividades fraudulentas.</li>
                <li>Contactar a personas que hayan ejercido su derecho de baja.</li>
                <li>Violar leyes aplicables de protección de datos o comunicaciones comerciales.</li>
                <li>Sobrepasar de forma artificial los límites del plan contratado.</li>
              </ul>
              <p className="mt-2">
                El incumplimiento de estas condiciones puede resultar en la suspensión inmediata de la cuenta.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.5 Propiedad intelectual</h3>
              <p>
                Todos los derechos sobre el software, diseño e interfaces de Arrivo son propiedad de sus
                titulares. El usuario conserva la propiedad de los contenidos que genera (textos de emails,
                campañas, datos de contactos propios).
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.6 Limitación de responsabilidad</h3>
              <p>
                Arrivo no garantiza la entregabilidad de los emails ni que los contactos respondan. El servicio
                se ofrece &ldquo;tal como está&rdquo;. En ningún caso Arrivo será responsable de daños indirectos,
                pérdida de negocio o lucro cesante derivados del uso del servicio.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.7 Cancelación</h3>
              <p>
                El usuario puede cancelar su suscripción en cualquier momento desde la sección de perfil.
                Arrivo se reserva el derecho de suspender cuentas que incumplan estas condiciones.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2.8 Ley aplicable y jurisdicción</h3>
              <p>
                Estos términos se rigen por la legislación española. Para cualquier controversia, las partes
                se someten a los juzgados y tribunales de España, salvo que la normativa aplicable establezca
                otro fuero imperativo.
              </p>
            </div>
          </div>
        </section>

        {/* Cookies */}
        <section id="cookies" className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-3">
            3. Política de Cookies
          </h2>

          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              Arrivo utiliza únicamente cookies <strong>estrictamente necesarias</strong> para el funcionamiento
              de la plataforma: cookies de sesión de autenticación (gestionadas por Supabase) y cookies de
              preferencias de usuario. No se utilizan cookies de publicidad ni de seguimiento de terceros.
            </p>
            <p>
              Al crear una cuenta y acceder a la plataforma, el usuario acepta el uso de estas cookies.
              Las cookies pueden eliminarse desde la configuración del navegador, aunque esto puede afectar
              al funcionamiento de la plataforma.
            </p>
          </div>
        </section>

        <div className="border-t border-gray-100 pt-8 text-xs text-gray-400">
          Para cualquier consulta legal: <strong className="text-gray-500">legal@arrivo.es</strong>
        </div>
      </main>
    </div>
  )
}
