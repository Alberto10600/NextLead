'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

type Fase = 'idle' | 'buscando' | 'listo' | 'enviando' | 'completado'

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

  const excluirContacto = (contactoId: string) => {
    setContactos((prev) => prev.filter((c) => c.id !== contactoId))
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
  const enProceso = fase === 'buscando' || fase === 'enviando'
  const tieneContactos = contactos.length > 0

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
          {enProceso && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Buscando en Hunter...</span>
            </div>
          )}

          {/* Editar */}
          <button
            onClick={() => router.push(`/dashboard/campanas/${id}/editar`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            Editar
          </button>

          {/* Añadir dominios (cuando ya hay contactos) */}
          {tieneContactos && !enProceso && (
            <button
              onClick={() => setMostrarAnadir((v) => !v)}
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

        {/* Input dominios — primera búsqueda */}
        {!tieneContactos && !enProceso && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Dominios objetivo</p>
            <p className="text-xs text-gray-400 mb-3">Pega los dominios de las empresas a prospectar. Uno por línea, comas o URLs completas.</p>
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
