const features = [
  {
    titulo: 'Encuentra contactos',
    descripcion: 'Claude AI identifica empresas reales de tu sector y extrae los emails de los responsables adecuados con alta precisión.',
    icon: (
      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    titulo: 'Emails personalizados',
    descripcion: 'Cada email se redacta analizando la web de la empresa con IA. Directo, cercano y con alta tasa de apertura y respuesta.',
    icon: (
      <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    titulo: 'Seguimientos automáticos',
    descripcion: 'Si no abren en 3 días o no responden en 7, NextLead hace los follow-ups por ti — y los cancela al recibir respuesta.',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
]

export default function Features() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14 space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Todo lo que necesitas para prospectar
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
            En piloto automático. Sin perder tiempo en tareas manuales.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.titulo}
              className="bg-[#0D1321] border border-white/[0.06] rounded-2xl p-6 space-y-4 hover:border-indigo-500/20 hover:bg-[#131C2E] transition-all duration-300 group"
            >
              <div className="bg-indigo-600/10 rounded-lg p-2.5 w-fit group-hover:bg-indigo-600/15 transition-colors duration-300">
                {f.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-100">{f.titulo}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
