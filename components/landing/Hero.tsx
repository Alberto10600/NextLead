import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-orange-500/10 blur-3xl rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[300px] bg-orange-500/6 blur-3xl rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto space-y-7">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-400/20 rounded-full px-4 py-1.5 text-xs text-orange-400">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Prospección B2B · Powered by Claude AI
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Encuentra tus próximos
          </span>
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
            clientes B2B
          </span>
          <br />
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            en minutos
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          NextLead descubre contactos cualificados en tu sector, genera emails hiperpersonalizados con IA
          y gestiona seguimientos automáticos — para que tu pipeline nunca se detenga.
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-medium px-6 py-3 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-orange-500/20"
          >
            Empieza gratis — 25 contactos
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-gray-200 text-gray-700 hover:text-gray-900 font-medium px-6 py-3 rounded-lg transition-all duration-150 text-sm"
          >
            Ver planes
          </Link>
        </div>

        <p className="text-xs text-gray-400 pt-1">
          Sin tarjeta de crédito · Plan Free para siempre
        </p>
      </div>
    </section>
  )
}
