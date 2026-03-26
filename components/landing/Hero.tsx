import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 text-center">
      {/* Glow de fondo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/30 rounded-full px-4 py-1.5 text-xs text-blue-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Powered by Claude AI · Hunter.io
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 leading-tight">
          Encuentra tus próximos{' '}
          <span className="text-blue-500">clientes B2B</span>{' '}
          en minutos
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          NextLead encuentra contactos cualificados en tu sector, genera emails personalizados con IA
          y gestiona seguimientos automáticos para que tu agencia no pare de crecer.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/registro">
            <Button size="lg">
              Empieza gratis — 25 contactos
            </Button>
          </Link>
          <Link href="/precios">
            <Button variant="secondary" size="lg">
              Ver planes
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate-600">
          Sin tarjeta de crédito · Plan Free para siempre
        </p>
      </div>
    </section>
  )
}
