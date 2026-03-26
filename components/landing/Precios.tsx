'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LIMITES_PLAN } from '@/types'
import type { Plan } from '@/types'
import Button from '@/components/ui/Button'

const PLANES: { plan: Plan; nombre: string; color: string; destacado?: boolean }[] = [
  { plan: 'free',     nombre: 'Free',     color: 'border-[#334155]' },
  { plan: 'starter',  nombre: 'Starter',  color: 'border-[#334155]' },
  { plan: 'pro',      nombre: 'Pro',      color: 'border-blue-500', destacado: true },
  { plan: 'business', nombre: 'Business', color: 'border-[#334155]' },
]

interface PreciosProps {
  planActual?: Plan
}

export default function Precios({ planActual }: PreciosProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<Plan | null>(null)

  const handleElegir = async (plan: Plan) => {
    if (plan === 'free') {
      router.push('/registro')
      return
    }

    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <section className="px-6 py-20" id="precios">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Planes simples y transparentes</h2>
          <p className="text-slate-400">Sin sorpresas. Cancela cuando quieras.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {PLANES.map(({ plan, nombre, color, destacado }) => {
            const limite = LIMITES_PLAN[plan]
            const esActual = planActual === plan

            return (
              <div
                key={plan}
                className={`
                  relative bg-[#1e293b] border-2 rounded-lg p-6 flex flex-col gap-4
                  ${color}
                  ${destacado ? 'shadow-lg shadow-blue-500/10' : ''}
                `}
              >
                {destacado && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{nombre}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-100">
                      {limite.precio_mensual === 0 ? 'Gratis' : `€${limite.precio_mensual}`}
                    </span>
                    {limite.precio_mensual > 0 && <span className="text-slate-400 text-sm">/mes</span>}
                  </div>
                </div>

                <ul className="space-y-2 flex-1 text-sm">
                  <li className="flex items-center gap-2 text-slate-300">
                    <span className="text-green-400">✓</span>
                    {limite.contactos_mes.toLocaleString()} contactos/mes
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <span className="text-green-400">✓</span>
                    {limite.campanas_activas === 999 ? 'Campañas ilimitadas' : `${limite.campanas_activas} campaña${limite.campanas_activas > 1 ? 's' : ''} activa${limite.campanas_activas > 1 ? 's' : ''}`}
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <span className={limite.seguimientos > 0 ? 'text-green-400' : 'text-slate-600'}>
                      {limite.seguimientos > 0 ? '✓' : '✗'}
                    </span>
                    {limite.seguimientos > 0 ? `${limite.seguimientos} follow-ups auto` : 'Sin follow-ups'}
                  </li>
                </ul>

                <Button
                  onClick={() => handleElegir(plan)}
                  loading={loading === plan}
                  disabled={esActual}
                  variant={destacado ? 'primary' : 'secondary'}
                  className="w-full"
                >
                  {esActual ? 'Plan actual' : plan === 'free' ? 'Empezar gratis' : 'Elegir plan'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
