'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'

interface DashboardData {
  campanas: Campana[]
  seguimientosPendientes: number
  seguimientosVencidos: number
  contactosRecientes: Contacto[]
  totalEnviados: number
  totalAbiertos: number
  totalRespondidos: number
  totalContactos: number
}

function Sparkline({ values, color = '#f97316' }: { values: number[]; color?: string }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const w = 80
  const h = 28
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ConversionBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-900">{value.toLocaleString()}</span>
          <span className="text-[10px] text-gray-400">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/campanas').then(r => r.json()).catch(() => ({ campanas: [] })),
      fetch('/api/seguimientos').then(r => r.json()).catch(() => ({ seguimientos: [] })),
      fetch('/api/contactos?limit=200').then(r => r.json()).catch(() => ({ contactos: [] })),
    ]).then(([campData, segData, contData]) => {
      const campanas: Campana[] = campData.campanas || []
      const seguimientos = segData.seguimientos || []
      const contactos: Contacto[] = contData.contactos || []

      const hoy = new Date()
      hoy.setHours(23, 59, 59, 999)
      const pendientes = seguimientos.filter((s: { estado: string; fecha_programada: string }) => s.estado === 'pendiente')
      const seguimientosPendientes = pendientes.filter((s: { fecha_programada: string }) => new Date(s.fecha_programada) <= hoy).length
      const seguimientosVencidos = pendientes.filter((s: { fecha_programada: string }) => new Date(s.fecha_programada) < new Date()).length

      const totalEnviados = campanas.reduce((s, c) => s + (c.total_enviados || 0), 0)
      const totalAbiertos = campanas.reduce((s, c) => s + (c.total_abiertos || 0), 0)
      const totalRespondidos = campanas.reduce((s, c) => s + (c.total_respondidos || 0), 0)

      // Contactos recientes con actividad (abiertos o respondidos)
      const contactosRecientes = contactos
        .filter(c => c.estado === 'abierto' || c.estado === 'respondido')
        .sort((a, b) => {
          const fa = a.fecha_apertura || a.fecha_respuesta || ''
          const fb = b.fecha_apertura || b.fecha_respuesta || ''
          return fb.localeCompare(fa)
        })
        .slice(0, 5)

      setData({
        campanas: campanas.slice(0, 6),
        seguimientosPendientes,
        seguimientosVencidos,
        contactosRecientes,
        totalEnviados,
        totalAbiertos,
        totalRespondidos,
        totalContactos: contactos.length,
      })
    }).catch((e) => {
      console.error('[dashboard] error:', e)
      setError('Error cargando el dashboard')
    }).finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-gray-100 rounded-xl" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-3">{error || 'Error cargando el dashboard'}</p>
          <button onClick={() => { setError(null); setLoading(true); setRefreshKey(k => k + 1) }} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const { campanas, seguimientosPendientes, seguimientosVencidos, contactosRecientes, totalEnviados, totalAbiertos, totalRespondidos, totalContactos } = data
  const tasaApertura = totalEnviados > 0 ? Math.round((totalAbiertos / totalEnviados) * 100) : 0
  const tasaRespuesta = totalEnviados > 0 ? Math.round((totalRespondidos / totalEnviados) * 100) : 0
  const campañasActivas = campanas.filter(c => c.estado === 'activa').length

  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="px-6 py-5 space-y-5 max-w-7xl">

        {/* Alertas */}
        {(seguimientosPendientes > 0 || seguimientosVencidos > 0) && (
          <div className="flex items-center gap-3">
            {seguimientosVencidos > 0 && (
              <Link href="/dashboard/seguimientos" className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-100 transition-colors">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-medium">{seguimientosVencidos} seguimiento{seguimientosVencidos !== 1 ? 's' : ''} vencido{seguimientosVencidos !== 1 ? 's' : ''}</span>
                <span className="text-red-400">→</span>
              </Link>
            )}
            {seguimientosPendientes > 0 && (
              <Link href="/dashboard/seguimientos" className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-amber-100 transition-colors">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="font-medium">{seguimientosPendientes} para hoy</span>
                <span className="text-amber-400">→</span>
              </Link>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Campañas activas', value: campañasActivas, sub: `${campanas.length} en total`, href: '/dashboard/campanas', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
            ), color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Emails enviados', value: totalEnviados.toLocaleString(), sub: `${totalContactos} contactos`, href: '/dashboard/contactos', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            ), color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Tasa de apertura', value: `${tasaApertura}%`, sub: `${totalAbiertos} abiertos`, href: '/dashboard/contactos', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ), color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Tasa de respuesta', value: `${tasaRespuesta}%`, sub: `${totalRespondidos} respondidos`, href: '/dashboard/pipeline', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            ), color: 'text-emerald-500', bg: 'bg-emerald-50' },
          ].map(({ label, value, sub, href, icon, color, bg }) => (
            <Link key={label} href={href} className="bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${color}`}>
                  {icon}
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-gray-400 transition-colors mt-1">
                  <path d="M9 5l7 7-7 7"/>
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">{sub}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* Funnel de conversión */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Embudo de conversión</p>
                <p className="text-xs text-gray-400 mt-0.5">Todas las campañas</p>
              </div>
            </div>
            <div className="space-y-3">
              <ConversionBar label="Enviados" value={totalEnviados} total={totalEnviados} color="bg-blue-400" />
              <ConversionBar label="Abiertos" value={totalAbiertos} total={totalEnviados} color="bg-amber-400" />
              <ConversionBar label="Respondidos" value={totalRespondidos} total={totalEnviados} color="bg-emerald-400" />
            </div>
            {totalEnviados === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Sin datos aún. Envía tu primera campaña.</p>
            )}
            {totalEnviados > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-500">{tasaApertura}%</p>
                  <p className="text-[10px] text-gray-400">Open rate</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-500">{tasaRespuesta}%</p>
                  <p className="text-[10px] text-gray-400">Reply rate</p>
                </div>
              </div>
            )}
          </div>

          {/* Actividad reciente */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Actividad reciente</p>
                <p className="text-xs text-gray-400 mt-0.5">Últimas aperturas y respuestas</p>
              </div>
              <Link href="/dashboard/contactos" className="text-[11px] text-orange-500 hover:text-orange-600 font-medium">ver todo</Link>
            </div>
            {contactosRecientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <p className="text-xs text-gray-400">Sin actividad reciente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactosRecientes.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${c.estado === 'respondido' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {[c.nombre, c.apellido].filter(Boolean).join(' ') || c.email}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{c.empresa || c.email}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                      c.estado === 'respondido'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {c.estado === 'respondido' ? 'Respondió' : 'Abrió'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campañas con rendimiento */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Campañas</p>
                <p className="text-xs text-gray-400 mt-0.5">Rendimiento por campaña</p>
              </div>
              <Link href="/dashboard/campanas/nueva" className="text-[11px] text-orange-500 hover:text-orange-600 font-medium">+ nueva</Link>
            </div>
            {campanas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-xs text-gray-400 mb-3">Sin campañas aún</p>
                <Link href="/dashboard/campanas/nueva" className="text-xs font-medium text-orange-500 hover:text-orange-600">Crear primera campaña →</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {campanas.map((c) => {
                  const tasa = c.total_enviados > 0 ? Math.round((c.total_abiertos / c.total_enviados) * 100) : 0
                  const sparkData = [c.total_enviados, c.total_abiertos, c.total_respondidos].filter(v => v > 0)
                  return (
                    <Link key={c.id} href={`/dashboard/campanas/${c.id}`} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${
                        c.estado === 'activa' ? 'bg-emerald-400' :
                        c.estado === 'pausada' ? 'bg-amber-400' :
                        c.estado === 'completada' ? 'bg-gray-300' : 'bg-gray-200'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate group-hover:text-orange-600 transition-colors">{c.nombre}</p>
                        <p className="text-[10px] text-gray-400">{c.total_enviados} enviados · {tasa}% apertura</p>
                      </div>
                      {sparkData.length > 1 && <Sparkline values={sparkData} />}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Link a analytics */}
        <Link href="/dashboard/analytics" className="flex items-center justify-between px-5 py-3.5 bg-white border border-gray-200 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Ver análisis completo</p>
              <p className="text-xs text-gray-400">Atribución de follow-ups, timing, calidad vs conversión</p>
            </div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 group-hover:text-orange-400 transition-colors"><path d="M9 5l7 7-7 7"/></svg>
        </Link>

      </div>
    </div>
  )
}
