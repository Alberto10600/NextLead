'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Seguimiento, Contacto } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'
import { formatearFecha } from '@/lib/utils'

const estadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pendiente: 'warning',
  enviado:   'success',
  cancelado: 'default',
}

const contactoEstadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pendiente:  'default',
  enviado:    'info',
  abierto:    'warning',
  respondido: 'success',
  rebotado:   'error',
  error:      'error',
}

interface SeguimientoConContacto extends Seguimiento {
  contactos?: Contacto
}

type Filtro = 'todos' | 'hoy' | 'vencidos' | 'enviados' | 'cancelados'

function esHoy(fecha: string): boolean {
  const d = new Date(fecha)
  const hoy = new Date()
  return d.toDateString() === hoy.toDateString()
}

function esVencido(fecha: string): boolean {
  return new Date(fecha) < new Date() && !esHoy(fecha)
}

export default function SeguimientosPage() {
  const [seguimientos, setSeguimientos] = useState<SeguimientoConContacto[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [detalle, setDetalle] = useState<SeguimientoConContacto | null>(null)
  const [notas, setNotas] = useState('')
  const [guardandoNotas, setGuardandoNotas] = useState(false)
  const [modoSeguimiento, setModoSeguimiento] = useState<'test' | 'real'>('test')

  const cargar = async () => {
    try {
      const r = await fetch('/api/seguimientos')
      const data = await r.json()
      if (!r.ok) {
        console.error('[seguimientos] API error:', data)
        setToast({ msg: data.error || 'Error cargando seguimientos', tipo: 'error' })
        return
      }
      console.log('[seguimientos] rows recibidos:', data.seguimientos?.length ?? 0)
      setSeguimientos(data.seguimientos || [])
    } catch (e) {
      console.error('[seguimientos] fetch error:', e)
      setToast({ msg: 'Error de red cargando seguimientos', tipo: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Stats
  const stats = useMemo(() => {
    const pendientes = seguimientos.filter((s) => s.estado === 'pendiente')
    return {
      pendientesHoy: pendientes.filter((s) => esHoy(s.fecha_programada) || esVencido(s.fecha_programada)).length,
      vencidos: pendientes.filter((s) => esVencido(s.fecha_programada)).length,
      enviados: seguimientos.filter((s) => s.estado === 'enviado').length,
      cancelados: seguimientos.filter((s) => s.estado === 'cancelado').length,
      total: seguimientos.length,
    }
  }, [seguimientos])

  // Filtrado
  const filtrados = useMemo(() => {
    switch (filtro) {
      case 'hoy': return seguimientos.filter((s) => s.estado === 'pendiente' && (esHoy(s.fecha_programada) || esVencido(s.fecha_programada)))
      case 'vencidos': return seguimientos.filter((s) => s.estado === 'pendiente' && esVencido(s.fecha_programada))
      case 'enviados': return seguimientos.filter((s) => s.estado === 'enviado')
      case 'cancelados': return seguimientos.filter((s) => s.estado === 'cancelado')
      default: return seguimientos
    }
  }, [seguimientos, filtro])

  const procesarAhora = async () => {
    if (modoSeguimiento === 'real') {
      const pendientes = seguimientos.filter((s) => s.estado === 'pendiente' && new Date(s.fecha_programada) <= new Date())
      const ok = window.confirm(
        `¿Enviar ${pendientes.length} seguimientos REALES?\n\nSe enviarán correos reales a los contactos.`
      )
      if (!ok) return
    }

    setProcesando(true)
    try {
      const res = await fetch('/api/seguimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo: modoSeguimiento }),
      })
      const data = await res.json()
      const msg = modoSeguimiento === 'test'
        ? `${data.procesados} marcados (test) · ${data.cancelados} cancelados`
        : `${data.procesados} enviados · ${data.cancelados} cancelados${data.errores?.length ? ` · ${data.errores.length} errores` : ''}`
      setToast({ msg, tipo: data.errores?.length ? 'error' : 'success' })
      cargar()
    } catch {
      setToast({ msg: 'Error al procesar seguimientos', tipo: 'error' })
    } finally {
      setProcesando(false)
    }
  }

  const marcarRespondido = async (contactoId: string) => {
    const res = await fetch(`/api/contactos/${contactoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'respondido' }),
    })
    if (res.ok) {
      setToast({ msg: 'Marcado como respondido. Seguimientos cancelados.', tipo: 'success' })
      setDetalle(null)
      cargar()
    }
  }

  const cancelarSeguimiento = async (segId: string) => {
    const res = await fetch(`/api/seguimientos/${segId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cancelado' }),
    })
    if (res.ok) {
      setToast({ msg: 'Seguimiento cancelado', tipo: 'info' })
      setDetalle(null)
      cargar()
    }
  }

  const guardarNotas = async (contactoId: string) => {
    setGuardandoNotas(true)
    await fetch(`/api/contactos/${contactoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas }),
    })
    setGuardandoNotas(false)
    setToast({ msg: 'Notas guardadas', tipo: 'success' })
  }

  const abrirDetalle = (s: SeguimientoConContacto) => {
    setDetalle(s)
    setNotas(s.contactos?.notas || '')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Seguimientos</h1>
          <p className="text-xs text-gray-400 mt-0.5">{stats.total} seguimientos programados</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.pendientesHoy > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              {stats.pendientesHoy} pendientes hoy
            </span>
          )}
          <div className="flex items-center gap-2">
            <div className="group relative">
              <button
                className="text-gray-300 hover:text-gray-500 transition-colors"
                tabIndex={-1}
                aria-label="Ayuda sobre modos de envío"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </button>
              <div className="pointer-events-none absolute right-0 top-6 z-20 hidden group-hover:block w-64 bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-lg">
                <p className="font-semibold mb-1">Modo Test vs Real</p>
                <p className="text-gray-300">
                  <strong className="text-white">Test:</strong> Marca los seguimientos como enviados sin enviar emails reales. Ideal para probar el flujo.
                </p>
                <p className="text-gray-300 mt-1">
                  <strong className="text-white">Real:</strong> Envía los emails a los contactos. Solo se procesan los vencidos o de hoy.
                </p>
              </div>
            </div>
          <div className="inline-flex items-center rounded-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => setModoSeguimiento((m) => m === 'test' ? 'real' : 'test')}
              className={`px-2 py-1.5 text-xs font-medium border-r border-gray-200 transition-colors ${
                modoSeguimiento === 'real'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-50 text-gray-400 hover:text-gray-600'
              }`}
            >
              {modoSeguimiento === 'real' ? '● Real' : '○ Test'}
            </button>
            <Button
              onClick={procesarAhora}
              loading={procesando}
              disabled={modoSeguimiento === 'real' ? stats.pendientesHoy === 0 : stats.total - stats.enviados - stats.cancelados === 0}
              size="sm"
              className="rounded-none border-0"
            >
              Procesar ahora
            </Button>
          </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Pendientes hoy', value: stats.pendientesHoy, color: 'text-amber-600' },
            { label: 'Vencidos', value: stats.vencidos, color: 'text-red-500' },
            { label: 'Enviados', value: stats.enviados, color: 'text-emerald-600' },
            { label: 'Cancelados', value: stats.cancelados, color: 'text-gray-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-lg font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 w-fit">
          {([
            ['todos', `Todos · ${stats.total}`],
            ['hoy', `Hoy · ${stats.pendientesHoy}`],
            ['vencidos', `Vencidos · ${stats.vencidos}`],
            ['enviados', `Enviados · ${stats.enviados}`],
            ['cancelados', `Cancelados · ${stats.cancelados}`],
          ] as [Filtro, string][]).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                filtro === f
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tabla + Panel detalle */}
        <div className="flex gap-4">
          {/* Tabla */}
          <div className={`${detalle ? 'flex-1' : 'w-full'} transition-all`}>
            {filtrados.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400 text-sm">
                {seguimientos.length === 0
                  ? 'No hay seguimientos programados. Se crean automáticamente al enviar una campaña.'
                  : 'No hay seguimientos en esta categoría.'}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Contacto</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Empresa</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">#</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Programado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((s) => {
                      const vencido = s.estado === 'pendiente' && esVencido(s.fecha_programada)
                      const seleccionado = detalle?.id === s.id
                      return (
                        <tr
                          key={s.id}
                          onClick={() => abrirDetalle(s)}
                          className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors duration-100 ${
                            seleccionado ? 'bg-orange-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-gray-800 font-medium text-sm">
                                {s.contactos
                                  ? `${s.contactos.nombre || ''} ${s.contactos.apellido || ''}`.trim() || s.contactos.email
                                  : '—'}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">{s.contactos?.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{s.contactos?.empresa || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-400">Follow-up #{s.numero_seguimiento}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={estadoBadge[s.estado] || 'default'}>
                              {vencido ? 'vencido' : s.estado}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${vencido ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              {formatearFecha(s.fecha_programada)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel detalle */}
          {detalle && detalle.contactos && (
            <div className="w-96 bg-white border border-gray-200 rounded-lg overflow-hidden shrink-0">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {[detalle.contactos.nombre, detalle.contactos.apellido].filter(Boolean).join(' ') || detalle.contactos.email}
                  </p>
                  <p className="text-xs text-gray-400">{detalle.contactos.cargo || detalle.contactos.empresa || ''}</p>
                </div>
                <button onClick={() => setDetalle(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="px-5 py-4 space-y-5 max-h-[calc(100vh-240px)] overflow-y-auto">
                {/* Estado del contacto */}
                <div className="flex items-center gap-2">
                  <Badge variant={contactoEstadoBadge[detalle.contactos.estado] || 'default'}>
                    {detalle.contactos.estado}
                  </Badge>
                  <span className="text-xs text-gray-400">Follow-up #{detalle.numero_seguimiento}</span>
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Timeline</p>
                  <div className="space-y-3">
                    {detalle.contactos.fecha_envio && (
                      <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700">Email enviado</p>
                          <p className="text-[11px] text-gray-400">{formatearFecha(detalle.contactos.fecha_envio)}</p>
                        </div>
                      </div>
                    )}
                    {detalle.contactos.fecha_apertura && (
                      <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700">Email abierto</p>
                          <p className="text-[11px] text-gray-400">{formatearFecha(detalle.contactos.fecha_apertura)}</p>
                        </div>
                      </div>
                    )}
                    {detalle.contactos.fecha_respuesta && (
                      <div className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-700">Respondió</p>
                          <p className="text-[11px] text-gray-400">{formatearFecha(detalle.contactos.fecha_respuesta)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        detalle.estado === 'enviado' ? 'bg-emerald-400' : detalle.estado === 'cancelado' ? 'bg-gray-300' : 'bg-amber-400'
                      }`} />
                      <div>
                        <p className="text-xs text-gray-700">
                          Follow-up #{detalle.numero_seguimiento} — {detalle.estado}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {detalle.fecha_enviado ? formatearFecha(detalle.fecha_enviado) : `Programado: ${formatearFecha(detalle.fecha_programada)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email original */}
                {detalle.contactos.email_generado && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Email original enviado</p>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Asunto:</span> {detalle.contactos.asunto_generado}
                      </p>
                      <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {detalle.contactos.email_generado}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contenido del follow-up */}
                {(detalle.asunto || detalle.cuerpo) && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Follow-up #{detalle.numero_seguimiento}
                      {detalle.estado === 'enviado' ? ' — enviado' : ' — pendiente de envío'}
                    </p>
                    <div className={`border rounded-lg p-3 space-y-2 ${detalle.estado === 'enviado' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                      {detalle.asunto && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">Asunto:</span> {detalle.asunto}
                        </p>
                      )}
                      {detalle.cuerpo && (
                        <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {detalle.cuerpo}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Si no hay contenido generado aún */}
                {!detalle.asunto && !detalle.cuerpo && detalle.estado === 'pendiente' && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Follow-up #{detalle.numero_seguimiento}</p>
                    <p className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      El contenido se generará con IA cuando proceses este seguimiento en modo real.
                    </p>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notas del comercial</p>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="ej. Llamé el martes, dice que lo mira la semana que viene..."
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all"
                  />
                  <button
                    onClick={() => guardarNotas(detalle.contactos!.id)}
                    disabled={guardandoNotas}
                    className="mt-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 transition-colors"
                  >
                    {guardandoNotas ? 'Guardando...' : 'Guardar notas'}
                  </button>
                </div>

                {/* Acciones rápidas */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Acciones</p>
                  <div className="space-y-2">
                    {detalle.contactos.estado !== 'respondido' && (
                      <button
                        onClick={() => marcarRespondido(detalle.contactos!.id)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Marcar como respondido (cancela seguimientos)
                      </button>
                    )}
                    {detalle.estado === 'pendiente' && (
                      <button
                        onClick={() => cancelarSeguimiento(detalle.id)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Cancelar este seguimiento
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
