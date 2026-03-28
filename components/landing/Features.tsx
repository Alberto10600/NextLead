const pasos = [
  {
    num: '01',
    titulo: 'Busca contactos reales',
    descripcion: 'Pega los dominios de las empresas que te interesan o deja que la IA genere una lista de empresas del sector. Hunter.io extrae los emails verificados de los responsables.',
    detalle: 'CEO, directores, managers — solo decisores reales, sin info@ ni contacto@',
    color: 'from-orange-500/10 to-orange-500/5',
    border: 'border-orange-100',
  },
  {
    num: '02',
    titulo: 'Analiza cada empresa con IA',
    descripcion: 'Claude analiza la web de cada empresa antes de escribir. Extrae su actividad, tamaño y punto de dolor concreto. El email se construye sobre ese análisis.',
    detalle: 'Cada email menciona algo específico de esa empresa — no parece un mail masivo',
    color: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-100',
  },
  {
    num: '03',
    titulo: 'Genera y envía en segundos',
    descripcion: 'Revisa los emails generados, edita los que quieras y envía. Prueba primero en modo test para verificar el flujo sin mandar nada real.',
    detalle: 'Emails cortos, directos y con CTA claro — 90 palabras máximo',
    color: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-100',
  },
  {
    num: '04',
    titulo: 'El seguimiento corre solo',
    descripcion: 'Si no hay respuesta, Arrivo programa y envía follow-ups automáticos a los 3, 7 y 14 días. Al recibir respuesta, cancela el resto y lo mueve al pipeline.',
    detalle: 'Cero esfuerzo manual después del primer envío',
    color: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-100',
  },
]

const features = [
  {
    icono: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    titulo: 'Hunter.io integrado',
    desc: 'Base de datos de +200M emails verificados. Solo contactos reales con cargo y empresa.',
  },
  {
    icono: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    titulo: 'Claude AI para emails',
    desc: 'Analiza la web de cada empresa y genera un email con gancho específico, problema real y CTA claro.',
  },
  {
    icono: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
    titulo: 'Follow-ups automáticos',
    desc: 'Se programan solos al enviar. Se cancelan solos al recibir respuesta. Sin configuración.',
  },
  {
    icono: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>
      </svg>
    ),
    titulo: 'Pipeline Kanban',
    desc: 'Gestiona las oportunidades que responden: Call → Propuesta → Negociando → Cerrado.',
  },
  {
    icono: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    titulo: 'Tracking de aperturas',
    desc: 'Pixel de seguimiento en cada email. Sabes quién abre, cuándo y desde dónde.',
  },
  {
    icono: (
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    titulo: 'Filtros anti-spam',
    desc: 'Excluye emails genéricos, limita contactos por empresa y filtra por cargo. Solo los mejores.',
  },
]

export default function Features() {
  return (
    <>
      {/* Cómo funciona */}
      <section className="px-6 py-20 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Cómo funciona</p>
            <h2 className="text-3xl font-bold text-gray-900">De lista vacía a pipeline lleno</h2>
            <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">En cuatro pasos. Sin código, sin integraciones, sin complicaciones.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {pasos.map((paso) => (
              <div key={paso.num} className={`bg-gradient-to-br ${paso.color} border ${paso.border} rounded-2xl p-6 space-y-3`}>
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-black text-gray-200 leading-none select-none">{paso.num}</span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{paso.titulo}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mt-1.5">{paso.descripcion}</p>
                    <p className="text-xs text-gray-400 bg-white/60 border border-gray-100 rounded-lg px-3 py-2 mt-3 leading-relaxed">
                      ✓ {paso.detalle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Características</p>
            <h2 className="text-3xl font-bold text-gray-900">Todo lo que necesitas, nada que no</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.titulo} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-200 hover:shadow-sm transition-all duration-200 group">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 mb-4 group-hover:bg-orange-100 transition-colors">
                  {f.icono}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{f.titulo}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / CTA final */}
      <section className="px-6 py-20 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-xs text-orange-600 font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Empieza en menos de 5 minutos
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Cuántos clientes puedes encontrar<br />esta semana?
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Crea tu primera campaña gratis. Sin tarjeta de crédito, sin límite de tiempo en el plan free.
            Si funciona para ti, creces con nosotros.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/registro"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-sm shadow-xl shadow-orange-500/20 hover:-translate-y-0.5"
            >
              Crear cuenta gratis
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a href="/precios" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Ver planes →
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4">100 contactos gratis · Sin tarjeta · Cancela cuando quieras</p>
        </div>
      </section>
    </>
  )
}
