'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto, Plantilla, Tono } from '@/types'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'
import ApolloSearchPanel from '@/components/dashboard/ApolloSearchPanel'

type Fase = 'idle' | 'buscando' | 'listo' | 'generando' | 'analizando' | 'enviando' | 'completado'

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  borrador:   { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Borrador' },
  procesando: { bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Procesando' },
  activa:     { bg: 'bg-emerald-50',  text: 'text-emerald-600', label: 'Activa' },
  pausada:    { bg: 'bg-amber-50',    text: 'text-amber-600',   label: 'Pausada' },
  completada: { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Completada' },
}

export default function DetalleCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campana, setCampana] = useState<Campana | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [fase, setFase] = useState<Fase>('idle')
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mostrarGenerador, setMostrarGenerador] = useState(false)
  const [descAgencia, setDescAgencia] = useState('')
  const [sectorObjetivo, setSectorObjetivo] = useState('')
  const [progGeneracion, setProgGeneracion] = useState<{ hecho: number; total: number } | null>(null)
  const [creandoSeguimientos, setCreandoSeguimientos] = useState(false)
  // P2-6 tono
  const [tono, setTono] = useState<Tono>('cercano')
  // P2-4 días de seguimiento
  const [diasSeguimiento, setDiasSeguimiento] = useState<number[]>([3, 7, 14])
  // P2-2 plantillas
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false)
  // P2-3 throttling
  const [limiteDiario, setLimiteDiario] = useState(0)
  const [modoEnvio, setModoEnvio] = useState<'test' | 'real'>('test')

  const cargarCampana = useCallback(async () => {
    const res = await fetch(`/api/campanas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCampana(data.campana)
      const lista = data.contactos || []
      setContactos(lista)
      if (lista.length > 0) setFase('listo')
      // Pre-fill generator fields from saved campaign data
      if (data.campana?.descripcion_agencia) setDescAgencia(data.campana.descripcion_agencia)
      if (data.campana?.sector) setSectorObjetivo(data.campana.sector)
      if (data.campana?.tono) setTono(data.campana.tono as Tono)
      if (data.campana?.dias_seguimiento?.length) setDiasSeguimiento(data.campana.dias_seguimiento)
      if (data.campana?.limite_diario !== undefined) setLimiteDiario(data.campana.limite_diario)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { cargarCampana() }, [cargarCampana])

  // Load plantillas once
  useEffect(() => {
    fetch('/api/plantillas').then(r => r.json()).then(d => setPlantillas(d.plantillas || []))
  }, [])

  // Auto-save description with debounce
  useEffect(() => {
    if (!campana || !descAgencia.trim()) return
    const timer = setTimeout(() => {
      fetch(`/api/campanas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion_agencia: descAgencia }),
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [descAgencia]) // eslint-disable-line react-hooks/exhaustive-deps

  const excluirContacto = (contactoId: string) => {
    setContactos((prev) => prev.filter((c) => c.id !== contactoId))
  }

  const guardarComoPlantilla = async () => {
    if (!descAgencia.trim()) return
    const nombre = window.prompt('Nombre para esta plantilla:', `${sectorObjetivo || 'Mi pitch'} — ${tono}`)
    if (!nombre) return
    setGuardandoPlantilla(true)
    try {
      const res = await fetch('/api/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sector: sectorObjetivo, descripcion: descAgencia, tono }),
      })
      const data = await res.json()
      if (res.ok) {
        setPlantillas(prev => [data.plantilla, ...prev])
        setToast({ msg: 'Plantilla guardada', tipo: 'success' })
      }
    } finally {
      setGuardandoPlantilla(false)
    }
  }

  const cargarPlantilla = (p: Plantilla) => {
    setDescAgencia(p.descripcion)
    if (p.sector) setSectorObjetivo(p.sector)
    setTono(p.tono)
  }

  const analizarContactos = async () => {
    const sinAnalisis = contactos.filter((c) => !c.analisis_empresa)
    if (sinAnalisis.length === 0) {
      setToast({ msg: 'Todos los contactos ya tienen análisis', tipo: 'info' })
      return
    }
    setFase('analizando')
    try {
      const res = await fetch('/api/analizar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacto_ids: sinAnalisis.map((c) => c.id) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error analizando')
      await cargarCampana()
      setToast({ msg: `${data.analizados} empresas analizadas`, tipo: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setFase('listo')
    }
  }

  const crearSeguimientos = async () => {
    setCreandoSeguimientos(true)
    try {
      const res = await fetch('/api/crear-seguimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campana_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creando seguimientos')
      setToast({ msg: data.creados > 0 ? `${data.creados} seguimientos creados para ${data.contactos_afectados} contactos` : data.mensaje, tipo: data.creados > 0 ? 'success' : 'info' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setCreandoSeguimientos(false)
    }
  }

  const generarEmails = async () => {
    const sinEmail = contactos.filter((c) => !c.email_generado)
    if (sinEmail.length === 0) {
      setToast({ msg: 'Todos los contactos ya tienen email generado', tipo: 'info' })
      return
    }
    setFase('generando')
    setProgGeneracion({ hecho: 0, total: sinEmail.length })

    // Save campaign settings for next time
    await fetch(`/api/campanas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion_agencia: descAgencia,
        sector: sectorObjetivo,
        tono,
        dias_seguimiento: diasSeguimiento,
        limite_diario: limiteDiario,
      }),
    })

    try {
      const res = await fetch('/api/generar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacto_ids: sinEmail.map((c) => c.id),
          descripcion_agencia: descAgencia,
          sector: sectorObjetivo,
          tono,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando emails')

      setMostrarGenerador(false)
      await cargarCampana()

      const msg = data.errores?.length
        ? `${data.generados}/${sinEmail.length} emails generados. ${data.errores.length} errores.`
        : `${data.generados} emails generados con IA`
      setToast({ msg, tipo: data.errores?.length ? 'info' : 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setFase('listo')
      setProgGeneracion(null)
    }
  }

  const enviarCampana = async () => {
    const conEmail = contactos.filter((c) => c.email_generado && c.estado === 'pendiente')
    if (conEmail.length === 0) {
      setToast({ msg: 'No hay contactos pendientes con email generado', tipo: 'info' })
      return
    }

    if (modoEnvio === 'real') {
      const ok = window.confirm(
        `¿Enviar ${conEmail.length} emails REALES a los contactos?\n\nEsto enviará correos electrónicos reales desde tu cuenta de Resend.`
      )
      if (!ok) return
    }

    setFase('enviando')
    try {
      const res = await fetch('/api/enviar-campana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campana_id: id, modo: modoEnvio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error enviando')

      await cargarCampana()
      const cola = data.en_cola > 0 ? ` · ${data.en_cola} en cola para mañana` : ''
      const msg = modoEnvio === 'test'
        ? `${data.enviados} emails marcados (modo test)${cola}`
        : `${data.enviados} emails enviados${data.errores?.length ? ` · ${data.errores.length} errores` : ''}${cola}`
      setToast({ msg, tipo: data.errores?.length ? 'error' : 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setFase('listo')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  if (!campana) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-700 font-medium mb-1">Campaña no encontrada</p>
        <Link href="/dashboard/campanas" className="text-sm text-orange-500 hover:text-orange-600 mt-4">
          ← Volver a campañas
        </Link>
      </div>
    )
  }

  const badge = estadoBadge[campana.estado] || estadoBadge.borrador
  const enProceso = fase === 'buscando' || fase === 'enviando' || fase === 'generando' || fase === 'analizando'
  const tieneContactos = contactos.length > 0
  const sinEmailGenerado = contactos.filter((c) => !c.email_generado).length

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard/campanas" className="text-gray-400 hover:text-gray-700 text-sm transition-colors shrink-0">
            Campañas
          </Link>
          <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h1 className="text-sm font-semibold text-gray-900 truncate">{campana.nombre}</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {fase === 'buscando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Buscando contactos...</span>
            </div>
          )}
          {fase === 'enviando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Enviando{modoEnvio === 'test' ? ' (test)' : ''}...</span>
            </div>
          )}
          {fase === 'analizando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Analizando empresas...</span>
            </div>
          )}
          {fase === 'generando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{progGeneracion ? `Generando ${progGeneracion.hecho}/${progGeneracion.total}...` : 'Generando emails...'}</span>
            </div>
          )}

          {/* Stats */}
          {campana.total_enviados > 0 && (
            <Link
              href={`/dashboard/campanas/${id}/stats`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-md transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Stats
            </Link>
          )}

          {/* Editar */}
          <button
            onClick={() => router.push(`/dashboard/campanas/${id}/editar`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            Editar
          </button>

          {/* Analizar empresas */}
          {tieneContactos && !enProceso && contactos.some((c) => !c.analisis_empresa) && (
            <button
              onClick={analizarContactos}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Analizar · {contactos.filter((c) => !c.analisis_empresa).length}
            </button>
          )}

          {/* Generar emails con IA */}
          {tieneContactos && !enProceso && sinEmailGenerado > 0 && (
            <button
              onClick={() => setMostrarGenerador((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors ${
                mostrarGenerador
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              Generar emails IA · {sinEmailGenerado}
            </button>
          )}

          {/* Enviar campaña */}
          {tieneContactos && !enProceso && contactos.some((c) => c.email_generado && c.estado === 'pendiente') && (
            <div className="inline-flex items-center rounded-md border border-gray-200 overflow-hidden">
              {/* Toggle test/real */}
              <button
                onClick={() => setModoEnvio((m) => m === 'test' ? 'real' : 'test')}
                title={modoEnvio === 'test' ? 'Modo test: sin envío real. Click para activar envío real' : 'Modo real: enviará correos reales. Click para volver a test'}
                className={`px-2 py-2 text-xs font-medium border-r border-gray-200 transition-colors ${
                  modoEnvio === 'real'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-50 text-gray-400 hover:text-gray-600'
                }`}
              >
                {modoEnvio === 'real' ? '● Real' : '○ Test'}
              </button>
              <button
                onClick={enviarCampana}
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 transition-colors ${
                  modoEnvio === 'real'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Enviar · {contactos.filter((c) => c.email_generado && c.estado === 'pendiente').length}
              </button>
            </div>
          )}

          {/* Crear seguimientos para contactos enviados */}
          {tieneContactos && !enProceso && contactos.some((c) => c.estado === 'enviado' || c.estado === 'abierto') && (
            <button
              onClick={crearSeguimientos}
              disabled={creandoSeguimientos}
              title="Crea los seguimientos programados para contactos ya enviados que no los tienen"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 transition-colors"
            >
              {creandoSeguimientos ? (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              )}
              Seguimientos
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Campaña', value: campana.nombre },
            { label: 'Contactos', value: contactos.length },
            { label: 'Emails enviados', value: campana.total_enviados || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Apollo — cuando no hay contactos */}
        {!tieneContactos && !enProceso && (
          <ApolloSearchPanel
            campana={campana}
            onContactosGuardados={(n) => {
              setToast({ msg: `${n} contactos guardados`, tipo: 'success' })
              cargarCampana()
            }}
            onError={(msg) => setToast({ msg, tipo: 'error' })}
          />
        )}

        {/* Panel análisis de empresas */}
        {tieneContactos && contactos.some((c) => c.analisis_empresa) && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Análisis de empresas</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {contactos.filter((c) => c.analisis_empresa).length} de {contactos.length} analizadas · los emails se generan usando este análisis
                </p>
              </div>
              {contactos.some((c) => !c.analisis_empresa) && !enProceso && (
                <button
                  onClick={analizarContactos}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  Analizar {contactos.filter((c) => !c.analisis_empresa).length} restantes →
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {contactos.filter((c) => c.analisis_empresa).map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-start gap-4">
                  <div className="w-32 shrink-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{c.empresa || c.dominio}</p>
                    {c.analisis_empresa?.tamano && (
                      <span className="inline-block mt-0.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {c.analisis_empresa.tamano}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    {c.analisis_empresa?.actividad && (
                      <p className="text-xs text-gray-600 leading-relaxed">{c.analisis_empresa.actividad}</p>
                    )}
                    {c.analisis_empresa?.dolor && (
                      <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded leading-relaxed">
                        <span className="font-medium">Punto de dolor:</span> {c.analisis_empresa.dolor}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel generar emails con IA */}
        {mostrarGenerador && tieneContactos && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Generar emails con IA</p>
                <p className="text-xs text-gray-400 mt-0.5">Claude redactará un email personalizado para cada uno de los {sinEmailGenerado} contactos sin email.</p>
              </div>
              <button onClick={() => setMostrarGenerador(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">

              {/* Plantilla loader */}
              {plantillas.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Cargar plantilla guardada</label>
                  <div className="flex flex-wrap gap-1.5">
                    {plantillas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => cargarPlantilla(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 text-gray-600 hover:text-orange-600 rounded-md transition-colors"
                      >
                        {p.nombre}
                        {p.sector && <span className="text-gray-300">·</span>}
                        {p.sector && <span className="text-gray-400">{p.sector}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Sector objetivo</label>
                  {sectorObjetivo ? (
                    <div className="flex items-center gap-2 py-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 font-medium">
                        {sectorObjetivo}
                      </span>
                      <button
                        onClick={() => setSectorObjetivo('')}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        cambiar
                      </button>
                    </div>
                  ) : (
                    <input
                      value={sectorObjetivo}
                      onChange={(e) => setSectorObjetivo(e.target.value)}
                      placeholder="ej. Ecommerce, SaaS..."
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                  )}
                </div>
                {/* P2-6 tono */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Tono del email</label>
                  <div className="flex gap-1">
                    {(['cercano', 'formal', 'millennial', 'tecnico'] as Tono[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTono(t)}
                        className={`flex-1 px-2 py-2 text-xs rounded-md border transition-colors capitalize ${
                          tono === t
                            ? 'bg-orange-50 border-orange-300 text-orange-600 font-medium'
                            : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">¿Qué ofrece tu agencia?</label>
                <textarea
                  value={descAgencia}
                  onChange={(e) => setDescAgencia(e.target.value)}
                  placeholder="ej. Somos una agencia de marketing digital especializada en SEO y publicidad de pago para ecommerce..."
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all"
                />
              </div>

              {/* P2-4 días de seguimiento */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Seguimientos automáticos — {diasSeguimiento.length} programado{diasSeguimiento.length !== 1 ? 's' : ''}
                </label>
                <div className="flex items-center flex-wrap gap-2">
                  {diasSeguimiento.map((dia, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-gray-400">#{i + 1}</span>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={dia}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 1
                          setDiasSeguimiento(prev => prev.map((d, j) => j === i ? v : d))
                        }}
                        className="w-10 text-center text-xs font-medium text-gray-700 bg-transparent outline-none"
                      />
                      <span className="text-xs text-gray-400">d</span>
                      {diasSeguimiento.length > 1 && (
                        <button
                          onClick={() => setDiasSeguimiento(prev => prev.filter((_, j) => j !== i))}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
                        >
                          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {diasSeguimiento.length < 5 && (
                    <button
                      onClick={() => setDiasSeguimiento(prev => [...prev, (prev[prev.length - 1] || 7) + 7])}
                      className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-orange-500 border border-dashed border-gray-200 hover:border-orange-300 rounded-lg transition-colors"
                    >
                      + añadir
                    </button>
                  )}
                </div>
              </div>

              {/* P2-3 límite diario */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Límite diario</label>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={limiteDiario || ''}
                      onChange={(e) => setLimiteDiario(parseInt(e.target.value) || 0)}
                      placeholder="∞"
                      className="w-12 text-center text-xs font-medium text-gray-700 bg-transparent outline-none"
                    />
                    <span className="text-xs text-gray-400">emails/día</span>
                  </div>
                  <span className="text-xs text-gray-400">{limiteDiario === 0 ? 'Sin límite' : `Máx. ${limiteDiario} por día`}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={generarEmails}
                  disabled={!descAgencia.trim() || !sectorObjetivo.trim()}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Generar {sinEmailGenerado} emails
                </button>
                <p className="text-xs text-gray-400">~{Math.ceil(sinEmailGenerado * 0.5 / 60)} min aprox.</p>
                {descAgencia.trim() && (
                  <button
                    onClick={guardarComoPlantilla}
                    disabled={guardandoPlantilla}
                    className="ml-auto text-xs text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                  >
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Guardar como plantilla
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        {tieneContactos && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="text-gray-900 font-semibold">{contactos.length}</span> contactos
            </p>
          </div>
        )}

        {/* Tabla */}
        {tieneContactos && (
          <TablaContactos
            contactos={contactos}
            onExcluir={['listo', 'completado'].includes(fase) ? excluirContacto : undefined}
          />
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}

      {/* Sticky loading indicator — visible when scrolled away from header */}
      {fase !== 'idle' && fase !== 'completado' && fase !== 'listo' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-full shadow-lg border border-white/10">
            <svg className="animate-spin w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="font-medium">
              {fase === 'buscando' && 'Buscando contactos...'}
              {fase === 'analizando' && 'Analizando empresas...'}
              {fase === 'enviando' && `Enviando${modoEnvio === 'test' ? ' (test)' : ''}...`}
              {fase === 'generando' && (progGeneracion
                ? `Generando emails ${progGeneracion.hecho}/${progGeneracion.total}`
                : 'Generando emails...'
              )}
            </span>
            {fase === 'generando' && progGeneracion && (
              <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((progGeneracion.hecho / progGeneracion.total) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
