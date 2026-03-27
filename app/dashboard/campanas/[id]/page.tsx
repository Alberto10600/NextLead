'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

type Fase = 'idle' | 'buscando' | 'listo' | 'generando' | 'enviando' | 'completado'

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  borrador:   { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Borrador' },
  procesando: { bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Procesando' },
  activa:     { bg: 'bg-emerald-50',  text: 'text-emerald-600', label: 'Activa' },
  pausada:    { bg: 'bg-amber-50',    text: 'text-amber-600',   label: 'Pausada' },
  completada: { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Completada' },
}

function parseDominios(texto: string): string[] {
  return texto
    .split(/[\n,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
    .filter((d) => d.length > 2 && d.includes('.'))
}

export default function DetalleCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campana, setCampana] = useState<Campana | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [fase, setFase] = useState<Fase>('idle')
  const [stats, setStats] = useState({ sinResultados: 0 })
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dominiosTexto, setDominiosTexto] = useState('')
  const [mostrarAnadir, setMostrarAnadir] = useState(false)
  const [dominiosNuevos, setDominiosNuevos] = useState('')
  const [mostrarGenerador, setMostrarGenerador] = useState(false)
  const [descAgencia, setDescAgencia] = useState('')
  const [sectorObjetivo, setSectorObjetivo] = useState('')
  const [progGeneracion, setProgGeneracion] = useState<{ hecho: number; total: number } | null>(null)
  const [modoBusqueda, setModoBusqueda] = useState<'dominios' | 'sector'>('dominios')
  const [sectorBusqueda, setSectorBusqueda] = useState('')
  const [paisBusqueda, setPaisBusqueda] = useState('España')
  const [buscandoSector, setBuscandoSector] = useState(false)
  const [dominiosSugeridos, setDominiosSugeridos] = useState<string[]>([])
  const [modoEnvio, setModoEnvio] = useState<'test' | 'real'>('test')

  const cargarCampana = useCallback(async () => {
    const res = await fetch(`/api/campanas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCampana(data.campana)
      const lista = data.contactos || []
      setContactos(lista)
      if (lista.length > 0) setFase('listo')
      if (data.campana?.dominios?.length) {
        setDominiosTexto(data.campana.dominios.join('\n'))
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { cargarCampana() }, [cargarCampana])

  const dominiosParsed = parseDominios(dominiosTexto)
  const dominiosNuevosParsed = parseDominios(dominiosNuevos)

  // Guardar dominios en la BD
  const guardarDominios = async (dominios: string[]) => {
    await fetch(`/api/campanas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dominios }),
    })
  }

  const buscarContactos = async (dominios: string[]) => {
    if (!campana || dominios.length === 0) return
    setFase('buscando')

    try {
      // Guardar dominios en BD antes de buscar
      await guardarDominios(Array.from(new Set([...dominiosParsed, ...dominios])))

      const res = await fetch('/api/enriquecer-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dominios }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error buscando contactos')

      if (data.total === 0) {
        setToast({ msg: 'Hunter no encontró contactos en estos dominios.', tipo: 'info' })
        setFase(contactos.length > 0 ? 'listo' : 'idle')
        return
      }

      const res2 = await fetch('/api/guardar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactos: data.contactos, campana_id: id }),
      })
      const data2 = await res2.json()
      if (!res2.ok) throw new Error(data2.error || 'Error guardando contactos')

      setContactos(data2.contactos)
      setStats({ sinResultados: data.dominios_sin_resultados?.length || 0 })
      setFase('listo')
      setMostrarAnadir(false)
      setDominiosNuevos('')
      setToast({ msg: `${data2.contactos.length} contactos encontrados en ${dominios.length} dominio${dominios.length !== 1 ? 's' : ''}`, tipo: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase(contactos.length > 0 ? 'listo' : 'idle')
    }
  }

  const buscarPorSector = async () => {
    if (!sectorBusqueda.trim()) return
    setBuscandoSector(true)
    setDominiosSugeridos([])
    try {
      const res = await fetch('/api/buscar-por-sector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: sectorBusqueda, pais: paisBusqueda, cantidad: 15 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDominiosSugeridos(data.dominios)
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setBuscandoSector(false)
    }
  }

  const excluirContacto = (contactoId: string) => {
    setContactos((prev) => prev.filter((c) => c.id !== contactoId))
  }

  const generarEmails = async () => {
    const sinEmail = contactos.filter((c) => !c.email_generado)
    if (sinEmail.length === 0) {
      setToast({ msg: 'Todos los contactos ya tienen email generado', tipo: 'info' })
      return
    }
    setFase('generando')
    setProgGeneracion({ hecho: 0, total: sinEmail.length })

    try {
      const res = await fetch('/api/generar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacto_ids: sinEmail.map((c) => c.id),
          descripcion_agencia: descAgencia,
          sector: sectorObjetivo,
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
      const msg = modoEnvio === 'test'
        ? `${data.enviados} emails marcados (modo test — sin envío real)`
        : `${data.enviados} emails enviados${data.errores?.length ? ` · ${data.errores.length} errores` : ''}`
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
  const enProceso = fase === 'buscando' || fase === 'enviando' || fase === 'generando'
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
              <span>Buscando en Hunter...</span>
            </div>
          )}
          {fase === 'enviando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Enviando (test)...</span>
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

          {/* Editar */}
          <button
            onClick={() => router.push(`/dashboard/campanas/${id}/editar`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            Editar
          </button>

          {/* Generar emails con IA */}
          {tieneContactos && !enProceso && sinEmailGenerado > 0 && (
            <button
              onClick={() => { setMostrarGenerador((v) => !v); setMostrarAnadir(false) }}
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

          {/* Añadir dominios (cuando ya hay contactos) */}
          {tieneContactos && !enProceso && (
            <button
              onClick={() => { setMostrarAnadir((v) => !v); setMostrarGenerador(false) }}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors ${
                mostrarAnadir
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              + Añadir dominios
            </button>
          )}

          {/* Buscar (cuando no hay contactos) */}
          {!tieneContactos && !enProceso && (
            <button
              onClick={() => buscarContactos(dominiosParsed)}
              disabled={dominiosParsed.length === 0}
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              Buscar contactos
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Campaña', value: campana.nombre },
            { label: 'Dominios buscados', value: dominiosParsed.length || '—' },
            { label: 'Contactos', value: contactos.length },
            { label: 'Sin resultados', value: stats.sinResultados || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Panel búsqueda — primera vez */}
        {!tieneContactos && !enProceso && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(['dominios', 'sector'] as const).map((modo) => (
                <button
                  key={modo}
                  onClick={() => setModoBusqueda(modo)}
                  className={`flex-1 py-3 text-xs font-medium transition-colors ${
                    modoBusqueda === modo
                      ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {modo === 'dominios' ? 'Por dominio' : 'Por sector con IA'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {modoBusqueda === 'dominios' ? (
                <>
                  <p className="text-xs text-gray-400 mb-3">Pega los dominios a prospectar. Uno por línea, comas o URLs completas.</p>
                  <textarea
                    value={dominiosTexto}
                    onChange={(e) => setDominiosTexto(e.target.value)}
                    placeholder={'stripe.com\nshopify.com\nvercel.com'}
                    rows={6}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 font-mono outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all"
                  />
                  {dominiosParsed.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{dominiosParsed.length} dominio{dominiosParsed.length !== 1 ? 's' : ''} detectado{dominiosParsed.length !== 1 ? 's' : ''}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-3">Claude genera una lista de empresas reales del sector. Luego Hunter busca sus contactos automáticamente.</p>
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Sector</label>
                      <input
                        value={sectorBusqueda}
                        onChange={(e) => setSectorBusqueda(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && buscarPorSector()}
                        placeholder="ej. Ecommerce, SaaS, Consultoría..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div className="w-36">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">País</label>
                      <input
                        value={paisBusqueda}
                        onChange={(e) => setPaisBusqueda(e.target.value)}
                        placeholder="España"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={buscarPorSector}
                    disabled={!sectorBusqueda.trim() || buscandoSector}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    {buscandoSector ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Buscando empresas...
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        Generar empresas con IA
                      </>
                    )}
                  </button>

                  {/* Resultados sugeridos */}
                  {dominiosSugeridos.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-500">{dominiosSugeridos.length} empresas encontradas por IA</p>
                        <button
                          onClick={() => setDominiosSugeridos([])}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Limpiar
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <div className="flex flex-wrap gap-1.5">
                          {dominiosSugeridos.map((d) => (
                            <span key={d} className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => buscarContactos(dominiosSugeridos)}
                        className="mt-3 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                      >
                        Buscar contactos en estas {dominiosSugeridos.length} empresas →
                      </button>
                    </div>
                  )}
                </>
              )}
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Sector objetivo</label>
                <input
                  value={sectorObjetivo}
                  onChange={(e) => setSectorObjetivo(e.target.value)}
                  placeholder="ej. Ecommerce, SaaS, Consultoría..."
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
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
              <div className="flex items-center gap-3">
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
              </div>
            </div>
          </div>
        )}

        {/* Panel añadir dominios — cuando ya hay contactos */}
        {mostrarAnadir && tieneContactos && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1">Añadir más dominios</p>
            <p className="text-xs text-orange-600/70 mb-3">Los nuevos contactos se añadirán a los existentes. No se duplicarán emails ya guardados.</p>
            <textarea
              value={dominiosNuevos}
              onChange={(e) => setDominiosNuevos(e.target.value)}
              placeholder={'nuevaempresa.com\notraempresa.es'}
              rows={4}
              className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 font-mono outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all"
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => buscarContactos(dominiosNuevosParsed)}
                disabled={dominiosNuevosParsed.length === 0 || enProceso}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                Buscar en {dominiosNuevosParsed.length > 0 ? `${dominiosNuevosParsed.length} dominio${dominiosNuevosParsed.length !== 1 ? 's' : ''}` : 'nuevos dominios'}
              </button>
              <button
                onClick={() => { setMostrarAnadir(false); setDominiosNuevos('') }}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Resumen */}
        {tieneContactos && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="text-gray-900 font-semibold">{contactos.length}</span> contactos
              {stats.sinResultados > 0 && <span className="ml-2 text-gray-400">· {stats.sinResultados} dominios sin resultados</span>}
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
    </div>
  )
}
