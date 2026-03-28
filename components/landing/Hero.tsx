import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-20 text-center">
      {/* Background glows */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-orange-500/8 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-orange-400/5 blur-3xl rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-xs text-orange-600 font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Prospección B2B automatizada con IA
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
          De cero a 100 leads
          <br />
          <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            cualificados en un día
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
          Arrivo encuentra los contactos reales de tu sector, analiza cada empresa con IA
          y redacta un email personalizado para cada uno. Tú solo revisas y envías.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-150 text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/30 hover:-translate-y-0.5"
          >
            Empieza gratis — sin tarjeta
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 font-medium px-7 py-3.5 rounded-xl transition-all duration-150 text-sm"
          >
            Ver planes y precios
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          Plan Free para siempre · 100 contactos al mes · Sin límite de campañas
        </p>

        {/* Stats bar */}
        <div className="mt-14 grid grid-cols-3 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200 max-w-lg mx-auto">
          {[
            { valor: '< 5 min', label: 'de campaña a primer email' },
            { valor: '3×', label: 'más respuestas vs. email genérico' },
            { valor: '100%', label: 'automático tras el primer envío' },
          ].map(({ valor, label }) => (
            <div key={label} className="bg-white px-4 py-4 text-center">
              <p className="text-xl font-bold text-gray-900">{valor}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
