'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import type { Campana } from '@/types'

// ─── types ────────────────────────────────────────────────────────────────────
interface ContactoAnalytics {
  id: string
  campana_id: string
  nombre?: string
  apellido?: string
  empresa?: string
  email?: string
  cargo?: string
  linkedin_url?: string
  estado: string
  fecha_envio?: string
  fecha_apertura?: string
  fecha_respuesta?: string
  numero_seguimiento: number
  total_aperturas?: number
  es_lead_caliente?: boolean
  created_at?: string
}

interface EventoApertura {
  id: string
  contacto_id: string
  campana_id: string
  created_at: string
}

type SortKey = 'nombre' | 'enviados' | 'apertura' | 'respuesta' | 'tiempo'
type SortDir = 'asc' | 'desc'
type Calidad = 'alta' | 'media' | 'baja'

// ─── helpers ──────────────────────────────────────────────────────────────────
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function calcularCalidad(c: ContactoAnalytics): Calidad {
  if (c.cargo?.trim() && c.linkedin_url?.trim()) return 'alta'
  if (c.cargo?.trim() || c.linkedin_url?.trim()) return 'media'
  return 'baja'
}

function diasEntre(a: string, b: string) {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0
}

// ─── sub-components ───────────────────────────────────────────────────────────
function BarH({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 tabular-nums w-6 text-right">{value}</span>
    </div>
  )
}

function MiniBar({ pct: p, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${p}%` }} />
    </div>
  )
}

function InsightCard({
  icon, titulo, valor, descripcion, color,
}: {
  icon: React.ReactNode; titulo: string; valor: string; descripcion: string; color: string
}) {
  return (
    <div className={`bg-white border rounded-xl p-4 flex gap-3 items-start border-gray-200`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-tight">{valor}</p>
        <p className="text-xs font-medium text-gray-700 mt-0.5">{titulo}</p>
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{descripcion}</p>
      </div>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [contactos, setContactos] = useState<ContactoAnalytics[]>([])
  const [eventosApertura, setEventosApertura] = useState<EventoApertura[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('enviados')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [drilldownCampana, setDrilldownCampana] = useState<string>('todas')
  const [soloLeadsCalientes, setSoloLeadsCalientes] = useState(false)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => {
        setCampanas(d.campanas || [])
        setContactos(d.contactos || [])
        setEventosApertura(d.eventosApertura || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── computed ────────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalEnviados = campanas.reduce((s, c) => s + (c.total_enviados || 0), 0)
    const totalAbiertos = campanas.reduce((s, c) => s + (c.total_abiertos || 0), 0)
    const totalRespondidos = campanas.reduce((s, c) => s + (c.total_respondidos || 0), 0)

    // Tiempo medio de respuesta (días)
    const tiempos = contactos
      .filter(c => c.estado === 'respondido' && c.fecha_envio && c.fecha_respuesta)
      .map(c => diasEntre(c.fecha_envio!, c.fecha_respuesta!))
    const avgTiempo = tiempos.length > 0
      ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
      : null

    // Follow-up attribution
    const respondidos = contactos.filter(c => c.estado === 'respondido')
    const followupAttr = [0, 1, 2, 3].map(n => ({
      n,
      label: n === 0 ? 'Email original' : `Follow-up #${n}`,
      count: respondidos.filter(c => (c.numero_seguimiento || 0) === n).length,
    }))

    // Day of week (aperturas)
    const aperturaPorDia = Array(7).fill(0) as number[]
    contactos.filter(c => c.fecha_apertura).forEach(c => {
      aperturaPorDia[new Date(c.fecha_apertura!).getDay()]++
    })

    // Quality vs conversion
    const grupos: Record<Calidad, ContactoAnalytics[]> = { alta: [], media: [], baja: [] }
    contactos.forEach(c => grupos[calcularCalidad(c)].push(c))
    const calidadStats = (['alta', 'media', 'baja'] as Calidad[]).map(cal => ({
      cal,
      total: grupos[cal].length,
      respondidos: grupos[cal].filter(c => c.estado === 'respondido').length,
      tasa: pct(grupos[cal].filter(c => c.estado === 'respondido').length, grupos[cal].length),
    }))

    // Per-campaign stats
    const campanaStats = campanas.map(c => {
      const cts = contactos.filter(ct => ct.campana_id === c.id)
      const tResp = cts
        .filter(ct => ct.estado === 'respondido' && ct.fecha_envio && ct.fecha_respuesta)
        .map(ct => diasEntre(ct.fecha_envio!, ct.fecha_respuesta!))
      return {
        ...c,
        numContactos: cts.length,
        tasaApertura: pct(c.total_abiertos, c.total_enviados),
        tasaRespuesta: pct(c.total_respondidos, c.total_enviados),
        avgDias: tResp.length > 0
          ? Math.round(tResp.reduce((a, b) => a + b, 0) / tResp.length)
          : null,
      }
    })

    // Insights
    const insights: { icon: React.ReactNode; titulo: string; valor: string; descripcion: string; color: string }[] = []

    // Follow-up best
    const mejorFU = [...followupAttr].sort((a, b) => b.count - a.count)[0]
    if (mejorFU && mejorFU.count > 0 && respondidos.length > 0) {
      const p = pct(mejorFU.count, respondidos.length)
      insights.push({
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
        valor: `${p}%`,
        titulo: mejorFU.n === 0 ? 'responde al email inicial' : `responde al Follow-up #${mejorFU.n}`,
        descripcion: mejorFU.n === 0
          ? 'Tu copy inicial convierte bien. Cuida el asunto y la primera línea.'
          : `No abandones tras el primer envío. El Follow-up #${mejorFU.n} es tu mayor generador de respuestas.`,
        color: 'bg-orange-50 text-orange-500',
      })
    }

    // Best day
    const maxAperturas = Math.max(...aperturaPorDia)
    if (maxAperturas > 0) {
      const mejorDia = aperturaPorDia.indexOf(maxAperturas)
      const totalAp = aperturaPorDia.reduce((a, b) => a + b, 0)
      const promedio = totalAp / 7
      const mult = promedio > 0 ? (maxAperturas / promedio).toFixed(1) : '—'
      insights.push({
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
        valor: DIAS[mejorDia],
        titulo: `mejor día de apertura`,
        descripcion: `${mult}x más aperturas que el promedio semanal. Programa tus envíos ese día.`,
        color: 'bg-blue-50 text-blue-500',
      })
    }

    // Quality conversion
    const altaStat = calidadStats.find(c => c.cal === 'alta')
    const bajaStat = calidadStats.find(c => c.cal === 'baja')
    if (altaStat && bajaStat && altaStat.total > 0) {
      if (bajaStat.tasa > 0 && altaStat.tasa > 0) {
        const ratio = (altaStat.tasa / bajaStat.tasa).toFixed(1)
        insights.push({
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
          valor: `${ratio}x`,
          titulo: 'más respuestas con contactos de alta calidad',
          descripcion: 'Filtrar bien antes de enviar te ahorra créditos y mejora todas tus métricas.',
          color: 'bg-emerald-50 text-emerald-500',
        })
      } else if (bajaStat.total > 0 && bajaStat.tasa === 0) {
        const pctBaja = pct(bajaStat.total, contactos.length)
        insights.push({
          icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
          valor: `${pctBaja}%`,
          titulo: 'de tus contactos son de baja calidad',
          descripcion: 'Estos contactos no tienen cargo ni LinkedIn — tienen tasa de respuesta ~0%. Filtra más antes de enviar.',
          color: 'bg-amber-50 text-amber-500',
        })
      }
    }

    // Reply time
    if (avgTiempo !== null) {
      const dias = Math.round(avgTiempo)
      const minFU = Math.max(1, Math.ceil(dias * 0.8))
      insights.push({
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        valor: `${dias} días`,
        titulo: 'tiempo medio hasta la respuesta',
        descripcion: dias <= 3
          ? 'Responden rápido. Mantén los follow-ups a 3-5 días para no dar mucho tiempo.'
          : `Espera al menos ${minFU} días entre el email inicial y el primer follow-up.`,
        color: 'bg-purple-50 text-purple-500',
      })
    }

    // Open rate vs industry
    const globalApertura = pct(totalAbiertos, totalEnviados)
    if (totalEnviados >= 10) {
      insights.push({
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
        valor: `${globalApertura}%`,
        titulo: 'tasa de apertura global',
        descripcion: globalApertura >= 40
          ? 'Excelente. Muy por encima del promedio del sector (20-25%). Tus asuntos enganchan.'
          : globalApertura >= 20
            ? 'En línea con el sector (20-25%). Experimenta con asuntos más cortos o personalizados.'
            : 'Por debajo del promedio. Prueba asuntos más directos o cambia el día de envío.',
        color: globalApertura >= 40 ? 'bg-emerald-50 text-emerald-500' : globalApertura >= 20 ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500',
      })
    }

    // Best campaign
    const conEnvios = campanaStats.filter(c => c.total_enviados > 0)
    if (conEnvios.length >= 2) {
      const mejor = [...conEnvios].sort((a, b) => b.tasaRespuesta - a.tasaRespuesta)[0]
      insights.push({
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
        valor: `${mejor.tasaRespuesta}%`,
        titulo: `mejor respuesta: ${mejor.nombre}`,
        descripcion: `Esta campaña es tu benchmark. Replica su sector, tono y timing en las próximas.`,
        color: 'bg-yellow-50 text-yellow-500',
      })
    }

    return {
      totalEnviados,
      totalAbiertos,
      totalRespondidos,
      avgTiempo,
      followupAttr,
      aperturaPorDia,
      calidadStats,
      campanaStats,
      insights,
      globalApertura,
      globalRespuesta: pct(totalRespondidos, totalEnviados),
    }
  }, [campanas, contactos])

  // ── sort campaigns ──────────────────────────────────────────────────────────
  const campanasSorted = useMemo(() => {
    return [...metrics.campanaStats].sort((a, b) => {
      let va = 0, vb = 0
      if (sortKey === 'nombre') return sortDir === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)
      if (sortKey === 'enviados') { va = a.total_enviados; vb = b.total_enviados }
      if (sortKey === 'apertura') { va = a.tasaApertura; vb = b.tasaApertura }
      if (sortKey === 'respuesta') { va = a.tasaRespuesta; vb = b.tasaRespuesta }
      if (sortKey === 'tiempo') { va = a.avgDias ?? -1; vb = b.avgDias ?? -1 }
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [metrics.campanaStats, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-orange-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  // ── render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
      </div>
    )
  }

  const maxFU = Math.max(...metrics.followupAttr.map(f => f.count), 1)
  const maxDia = Math.max(...metrics.aperturaPorDia, 1)
  const maxCalidad = Math.max(...metrics.calidadStats.map(c => c.tasa), 1)

  const estadoColor: Record<string, string> = {
    activa: 'bg-emerald-400', pausada: 'bg-amber-400',
    completada: 'bg-gray-300', borrador: 'bg-gray-200', procesando: 'bg-blue-400',
  }

  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="px-6 py-5 max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Análisis de campañas</h1>
            <p className="text-xs text-gray-400 mt-0.5">Decisiones basadas en tus datos reales</p>
          </div>
          <Link href="/dashboard/campanas/nueva" className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva campaña
          </Link>
        </div>

        {/* KPIs globales */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Emails enviados', value: metrics.totalEnviados.toLocaleString(),
              sub: `${campanas.length} campañas`, color: 'bg-orange-50 text-orange-500',
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
            },
            {
              label: 'Open rate global', value: `${metrics.globalApertura}%`,
              sub: `${metrics.totalAbiertos} abiertos`, color: 'bg-blue-50 text-blue-500',
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
            },
            {
              label: 'Reply rate global', value: `${metrics.globalRespuesta}%`,
              sub: `${metrics.totalRespondidos} respondidos`, color: 'bg-emerald-50 text-emerald-500',
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
            },
            {
              label: 'Tiempo medio respuesta',
              value: metrics.avgTiempo !== null ? `${Math.round(metrics.avgTiempo)}d` : '—',
              sub: metrics.avgTiempo !== null ? 'desde envío hasta reply' : 'Sin datos aún',
              color: 'bg-purple-50 text-purple-500',
              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
            },
          ].map(({ label, value, sub, color, icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>{icon}</div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Insights algorítmicos */}
        {metrics.insights.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Insights</p>
            <div className="grid grid-cols-3 gap-3">
              {metrics.insights.map((ins, i) => (
                <InsightCard key={i} {...ins} />
              ))}
            </div>
          </div>
        )}

        {/* Comparativa de campañas */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Comparativa de campañas</p>
              <p className="text-xs text-gray-400 mt-0.5">Haz clic en una columna para ordenar</p>
            </div>
          </div>
          {campanasSorted.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">
              Sin campañas aún. <Link href="/dashboard/campanas/nueva" className="text-orange-500 hover:underline">Crea tu primera campaña →</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {([
                    ['nombre', 'Campaña'],
                    ['enviados', 'Enviados'],
                    ['apertura', 'Apertura'],
                    ['respuesta', 'Respuesta'],
                    ['tiempo', 'T. respuesta'],
                  ] as [SortKey, string][]).map(([k, label]) => (
                    <th
                      key={k}
                      onClick={() => toggleSort(k)}
                      className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 select-none"
                    >
                      {label}<SortIcon k={k} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider text-left">Embudo</th>
                </tr>
              </thead>
              <tbody>
                {campanasSorted.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/campanas/${c.id}`} className="flex items-center gap-2 group">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estadoColor[c.estado] || 'bg-gray-200'}`} />
                        <span className="text-xs font-medium text-gray-800 group-hover:text-orange-600 transition-colors max-w-[140px] truncate">{c.nombre}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 tabular-nums">{c.total_enviados}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold tabular-nums ${c.tasaApertura >= 40 ? 'text-emerald-600' : c.tasaApertura >= 20 ? 'text-blue-600' : 'text-gray-500'}`}>
                          {c.tasaApertura}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold tabular-nums ${c.tasaRespuesta >= 10 ? 'text-emerald-600' : c.tasaRespuesta >= 5 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {c.tasaRespuesta}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                      {c.avgDias !== null ? `${c.avgDias}d` : '—'}
                    </td>
                    <td className="px-4 py-3 w-40">
                      {c.total_enviados > 0 ? (
                        <div className="space-y-1">
                          <MiniBar pct={100} color="bg-blue-300" />
                          <MiniBar pct={c.tasaApertura} color="bg-amber-400" />
                          <MiniBar pct={c.tasaRespuesta} color="bg-emerald-400" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300">Sin envíos</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tres columnas de análisis */}
        <div className="grid grid-cols-3 gap-5">

          {/* Follow-up attribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Atribución de respuestas</p>
            <p className="text-xs text-gray-400 mb-4">¿Qué touchpoint generó la respuesta?</p>
            {metrics.followupAttr.every(f => f.count === 0) ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin respuestas registradas aún</p>
            ) : (
              <div className="space-y-3.5">
                {metrics.followupAttr.map(f => (
                  <div key={f.n}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 font-medium">{f.label}</span>
                      <span className="text-[11px] text-gray-400">{pct(f.count, metrics.totalRespondidos)}%</span>
                    </div>
                    <BarH value={f.count} max={maxFU} color={f.n === 0 ? 'bg-orange-400' : f.n === 1 ? 'bg-amber-400' : f.n === 2 ? 'bg-blue-400' : 'bg-emerald-400'} />
                  </div>
                ))}
                <p className="text-[10px] text-gray-300 pt-1 border-t border-gray-50">
                  Basado en el último touchpoint antes de cada respuesta
                </p>
              </div>
            )}
          </div>

          {/* Aperturas por día */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Aperturas por día</p>
            <p className="text-xs text-gray-400 mb-4">¿Cuándo leen tus emails?</p>
            {metrics.aperturaPorDia.every(v => v === 0) ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin aperturas registradas aún</p>
            ) : (
              <div className="flex items-end gap-1.5 h-28">
                {metrics.aperturaPorDia.map((v, i) => {
                  const h = maxDia > 0 ? Math.round((v / maxDia) * 100) : 0
                  const isMax = v === maxDia && v > 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400 tabular-nums">{v > 0 ? v : ''}</span>
                      <div className="w-full flex items-end" style={{ height: '80px' }}>
                        <div
                          className={`w-full rounded-t-sm transition-all duration-500 ${isMax ? 'bg-orange-400' : 'bg-gray-200'}`}
                          style={{ height: `${Math.max(h, v > 0 ? 8 : 2)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-medium ${isMax ? 'text-orange-500' : 'text-gray-400'}`}>{DIAS[i]}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Calidad vs conversión */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Calidad vs conversión</p>
            <p className="text-xs text-gray-400 mb-4">Tasa de respuesta por tier de contacto</p>
            <div className="space-y-4">
              {metrics.calidadStats.map(({ cal, total, respondidos: r, tasa }) => (
                <div key={cal}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cal === 'alta' ? 'bg-emerald-400' : cal === 'media' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                      <span className="text-xs font-medium text-gray-700 capitalize">{cal}</span>
                      <span className="text-[10px] text-gray-400">{total} contactos</span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${cal === 'alta' ? 'text-emerald-600' : cal === 'media' ? 'text-amber-600' : 'text-gray-400'}`}>
                      {tasa}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cal === 'alta' ? 'bg-emerald-400' : cal === 'media' ? 'bg-amber-400' : 'bg-gray-300'}`}
                      style={{ width: `${maxCalidad > 0 ? (tasa / maxCalidad) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1">{r} respondidos de {total}</p>
                </div>
              ))}
            </div>
            {contactos.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Sin contactos aún</p>
            )}
          </div>

        </div>

        {/* ── Drill-down: quién abrió ────────────────────────────────────────── */}
        {(() => {
          // Contactos que han abierto al menos una vez
          const abiertos = contactos
            .filter(c => ['abierto', 'respondido'].includes(c.estado) || (c.total_aperturas ?? 0) > 0)
            .filter(c => drilldownCampana === 'todas' || c.campana_id === drilldownCampana)
            .filter(c => !soloLeadsCalientes || c.es_lead_caliente)
            .sort((a, b) => (b.total_aperturas ?? 0) - (a.total_aperturas ?? 0))

          const leadsCalientes = contactos.filter(c =>
            c.es_lead_caliente &&
            (drilldownCampana === 'todas' || c.campana_id === drilldownCampana)
          )

          // Aperturas recientes (últimas 24h)
          const hace24h = new Date(Date.now() - 86400000).toISOString()
          const eventosRecientes = eventosApertura.filter(e =>
            e.created_at > hace24h &&
            (drilldownCampana === 'todas' || e.campana_id === drilldownCampana)
          )

          return (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Quién abrió tu email</p>
                    <p className="text-xs text-gray-400 mt-0.5">Drill-down individual — cada apertura registrada</p>
                  </div>
                  {leadsCalientes.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      {leadsCalientes.length} lead{leadsCalientes.length > 1 ? 's' : ''} caliente{leadsCalientes.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {eventosRecientes.length > 0 && (
                    <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                      {eventosRecientes.length} apertura{eventosRecientes.length > 1 ? 's' : ''} últimas 24h
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSoloLeadsCalientes(v => !v)}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors ${soloLeadsCalientes ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    🔥 Solo leads calientes
                  </button>
                  <select
                    value={drilldownCampana}
                    onChange={e => setDrilldownCampana(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:border-orange-300"
                  >
                    <option value="todas">Todas las campañas</option>
                    {campanas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {abiertos.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">
                  {soloLeadsCalientes ? 'No hay leads calientes aún. Aparecen cuando un contacto abre el email 2+ veces sin responder.' : 'Nadie ha abierto tus emails aún. El tracking pixel registrará cada apertura aquí.'}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Contacto</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Empresa</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Campaña</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Aperturas</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Última apertura</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abiertos.map(c => {
                      const campana = campanas.find(ca => ca.id === c.campana_id)
                      const eventosContacto = eventosApertura
                        .filter(e => e.contacto_id === c.id)
                        .sort((a, b) => b.created_at.localeCompare(a.created_at))
                      const ultimaApertura = eventosContacto[0]?.created_at || c.fecha_apertura
                      const numAperturas = c.total_aperturas ?? (eventosContacto.length || (c.fecha_apertura ? 1 : 0))
                      const nombreCompleto = [c.nombre, c.apellido].filter(Boolean).join(' ') || c.email || '—'

                      return (
                        <tr key={c.id} className={`border-b border-gray-50 last:border-0 transition-colors ${c.es_lead_caliente ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-gray-50/50'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {c.es_lead_caliente && (
                                <span title="Lead caliente — abrió 2+ veces sin responder" className="text-base leading-none">🔥</span>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate max-w-[160px]">{nombreCompleto}</p>
                                {c.cargo && <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{c.cargo}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[120px]">{c.empresa || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[140px]">{campana?.nombre || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: Math.min(numAperturas, 5) }).map((_, i) => (
                                  <span key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-400' : 'bg-orange-400'}`} />
                                ))}
                                {numAperturas > 5 && <span className="text-[10px] text-gray-400 ml-0.5">+{numAperturas - 5}</span>}
                              </div>
                              <span className={`text-xs font-bold tabular-nums ${numAperturas >= 3 ? 'text-red-600' : numAperturas >= 2 ? 'text-orange-500' : 'text-blue-600'}`}>
                                {numAperturas}x
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 tabular-nums">
                            {ultimaApertura
                              ? new Date(ultimaApertura).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {c.estado === 'respondido' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" /> Respondió
                              </span>
                            ) : c.es_lead_caliente ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" /> Lead caliente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-blue-400" /> Abrió
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })()}

        {/* Nota metodológica */}
        <p className="text-[10px] text-gray-300 text-center pb-2">
          Datos calculados en tiempo real desde tus campañas y contactos. La atribución se basa en el último follow-up enviado antes de cada respuesta.
        </p>

      </div>
    </div>
  )
}
