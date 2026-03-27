'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Spinner from '@/components/ui/Spinner'

interface StatsData {
  campana: {
    id: string
    nombre: string
    sector: string
    estado: string
    created_at: string
  }
  funnel: {
    total: number
    pendientes: number
    enviados: number
    abiertos: number
    respondidos: number
    rebotados: number
    errores: number
  }
  tasas: { apertura: number; respuesta: number; rebote: number }
  tiempoMedioAperturaHoras: number | null
  timeline: { fecha: string; enviados: number; abiertos: number; respondidos: number }[]
  seguimientos: {
    enviados: number
    pendientes: number
    cancelados: number
    porNumero: { numero: number; enviados: number; pendientes: number; cancelados: number }[]
  }
}

// ─── Funnel SVG ────────────────────────────────────────────────────────────────
function FunnelBar({ label, value, max, color, pct }: {
  label: string; value: number; max: number; color: string; pct?: number
}) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-right text-xs text-gray-500 shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 ${color}`}
          style={{ width: `${width}%` }}
        >
          {value > 0 && width > 12 && (
            <span className="text-[10px] font-semibold text-white">{value}</span>
          )}
        </div>
      </div>
      <div className="w-16 text-xs text-gray-400 shrink-0">
        {value} {pct !== undefined && <span className="text-gray-300">·</span>} {pct !== undefined && <span className="font-medium text-gray-600">{pct}%</span>}
      </div>
    </div>
  )
}

// ─── Timeline Chart SVG ────────────────────────────────────────────────────────
function TimelineChart({ data }: { data: StatsData['timeline'] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Sin datos de envíos todavía
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.enviados, d.abiertos, d.respondidos)), 1)
  const W = 600
  const H = 140
  const PAD = { top: 10, right: 16, bottom: 32, left: 28 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const n = data.length
  const barW = Math.max(Math.min(Math.floor(chartW / n) - 4, 40), 6)
  const step = chartW / n

  const yPos = (v: number) => PAD.top + chartH - (v / maxVal) * chartH

  // Y axis labels
  const yTicks = [0, Math.round(maxVal / 2), maxVal]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {/* Grid lines */}
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={PAD.left} y1={yPos(t)}
            x2={W - PAD.right} y2={yPos(t)}
            stroke="#e5e7eb" strokeWidth="1"
          />
          <text x={PAD.left - 4} y={yPos(t) + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{t}</text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const cx = PAD.left + i * step + step / 2
        const tripleW = barW * 3 + 4
        const x0 = cx - tripleW / 2

        return (
          <g key={d.fecha}>
            {/* enviados */}
            {d.enviados > 0 && (
              <rect
                x={x0} y={yPos(d.enviados)}
                width={barW} height={chartH - (yPos(d.enviados) - PAD.top)}
                fill="#e5e7eb" rx="2"
              />
            )}
            {/* abiertos */}
            {d.abiertos > 0 && (
              <rect
                x={x0 + barW + 2} y={yPos(d.abiertos)}
                width={barW} height={chartH - (yPos(d.abiertos) - PAD.top)}
                fill="#f97316" rx="2"
              />
            )}
            {/* respondidos */}
            {d.respondidos > 0 && (
              <rect
                x={x0 + barW * 2 + 4} y={yPos(d.respondidos)}
                width={barW} height={chartH - (yPos(d.respondidos) - PAD.top)}
                fill="#10b981" rx="2"
              />
            )}
            {/* fecha label */}
            <text
              x={cx} y={H - PAD.bottom + 14}
              textAnchor="middle" fontSize="9" fill="#9ca3af"
            >
              {d.fecha.slice(5)} {/* MM-DD */}
            </text>
          </g>
        )
      })}

      {/* Leyenda */}
      <g transform={`translate(${PAD.left}, ${H - 6})`}>
        <rect x="0" y="0" width="8" height="8" fill="#e5e7eb" rx="1" />
        <text x="11" y="7" fontSize="9" fill="#9ca3af">Enviados</text>
        <rect x="60" y="0" width="8" height="8" fill="#f97316" rx="1" />
        <text x="71" y="7" fontSize="9" fill="#9ca3af">Abiertos</text>
        <rect x="118" y="0" width="8" height="8" fill="#10b981" rx="1" />
        <text x="129" y="7" fontSize="9" fill="#9ca3af">Respondidos</text>
      </g>
    </svg>
  )
}

// ─── Gauge semicircle ──────────────────────────────────────────────────────────
function Gauge({ pct, color, label }: { pct: number; color: string; label: string }) {
  const r = 36
  const cx = 50
  const cy = 50
  const circum = Math.PI * r
  const offset = circum - (Math.min(pct, 100) / 100) * circum

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 56" className="w-28">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#f3f4f6" strokeWidth="8" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${circum}`}
          strokeDashoffset={`${offset}`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#111827">
          {pct}%
        </text>
      </svg>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const { id } = useParams<{ id: string }>()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campanas/${id}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  if (!stats) {
    return (
      <div className="text-center py-24 text-gray-500">
        No se pudieron cargar las estadísticas.{' '}
        <Link href={`/dashboard/campanas/${id}`} className="text-orange-500 hover:underline">Volver</Link>
      </div>
    )
  }

  const { campana, funnel, tasas, tiempoMedioAperturaHoras, timeline, seguimientos } = stats
  const maxFunnel = funnel.enviados || funnel.total

  function formatHoras(h: number | null): string {
    if (h === null) return '—'
    if (h < 1) return 'menos de 1h'
    if (h < 24) return `${h}h`
    return `${Math.round(h / 24)}d`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/campanas/${id}`}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-1"
          >
            ← {campana.nombre}
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Estadísticas</h1>
          <p className="text-xs text-gray-400 mt-0.5">Sector: {campana.sector}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          campana.estado === 'activa' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
        }`}>
          {campana.estado}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total contactos', value: funnel.total, sub: `${funnel.pendientes} pendientes` },
          { label: 'Emails enviados', value: funnel.enviados, sub: funnel.rebotados > 0 ? `${funnel.rebotados} rebotes` : 'sin rebotes' },
          { label: 'Tiempo medio apertura', value: formatHoras(tiempoMedioAperturaHoras), sub: tiempoMedioAperturaHoras !== null ? 'desde envío' : 'sin datos' },
          { label: 'Seguimientos', value: seguimientos.enviados, sub: `${seguimientos.pendientes} pendientes` },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tasas gauges */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Tasas de conversión</h2>
        <div className="flex justify-around">
          <Gauge pct={tasas.apertura}   color="#f97316" label="Tasa apertura" />
          <Gauge pct={tasas.respuesta}  color="#10b981" label="Tasa respuesta" />
          <Gauge pct={tasas.rebote}     color="#ef4444" label="Tasa rebote" />
        </div>
      </div>

      {/* Funnel */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Funnel de conversión</h2>
        <div className="space-y-2.5">
          <FunnelBar label="Enviados"    value={funnel.enviados}    max={maxFunnel} color="bg-gray-400" />
          <FunnelBar label="Abiertos"    value={funnel.abiertos}    max={maxFunnel} color="bg-orange-400" pct={tasas.apertura} />
          <FunnelBar label="Respondidos" value={funnel.respondidos} max={maxFunnel} color="bg-emerald-500" pct={tasas.respuesta} />
          {funnel.rebotados > 0 && (
            <FunnelBar label="Rebotados" value={funnel.rebotados}   max={maxFunnel} color="bg-red-400" pct={tasas.rebote} />
          )}
          {funnel.errores > 0 && (
            <FunnelBar label="Errores"   value={funnel.errores}     max={maxFunnel} color="bg-gray-300" />
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-1">Actividad por día</h2>
        <p className="text-xs text-gray-400 mb-4">Enviados, abiertos y respondidos agrupados por fecha</p>
        <TimelineChart data={timeline} />
      </div>

      {/* Seguimientos breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Seguimientos</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900">{seguimientos.enviados}</p>
            <p className="text-xs text-gray-400">Enviados</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-amber-600">{seguimientos.pendientes}</p>
            <p className="text-xs text-gray-400">Pendientes</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-400">{seguimientos.cancelados}</p>
            <p className="text-xs text-gray-400">Cancelados</p>
          </div>
        </div>
        <div className="space-y-2 border-t border-gray-100 pt-3">
          {seguimientos.porNumero.map((s) => (
            <div key={s.numero} className="flex items-center gap-3 text-xs">
              <span className="w-24 text-gray-400">Seguimiento #{s.numero}</span>
              <div className="flex gap-2">
                {s.enviados > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">{s.enviados} enviados</span>
                )}
                {s.pendientes > 0 && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">{s.pendientes} pendientes</span>
                )}
                {s.cancelados > 0 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">{s.cancelados} cancelados</span>
                )}
                {s.enviados === 0 && s.pendientes === 0 && s.cancelados === 0 && (
                  <span className="text-gray-300">sin datos</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
