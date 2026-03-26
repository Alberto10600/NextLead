const features = [
  {
    titulo: 'Encuentra contactos',
    descripcion: 'Claude AI identifica empresas reales de tu sector y Hunter.io extrae los emails de los responsables adecuados.',
    icono: '◎',
  },
  {
    titulo: 'Emails personalizados',
    descripcion: 'Cada email se redacta con IA analizando la web de la empresa. Directo, cercano y con alta tasa de respuesta.',
    icono: '✉',
  },
  {
    titulo: 'Seguimientos automáticos',
    descripcion: 'Si no abren en 3 días, si no responden en 7... NextLead hace los follow-ups por ti, cancelándolos al recibir respuesta.',
    icono: '↺',
  },
]

export default function Features() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-100 text-center mb-12">
          Todo lo que necesitas para prospectar en piloto automático
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.titulo}
              className="bg-[#1e293b] border border-[#334155] rounded-lg p-6 space-y-3 hover:border-blue-600/50 transition-all duration-300"
            >
              <div className="text-3xl text-blue-500">{f.icono}</div>
              <h3 className="text-lg font-semibold text-slate-200">{f.titulo}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.descripcion}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
