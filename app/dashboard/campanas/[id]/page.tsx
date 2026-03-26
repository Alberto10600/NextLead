'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'
import { PAISES_HUNTER, DEPARTAMENTOS_HUNTER, SENIORITY_HUNTER } from '@/types'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

type Fase = 'idle' | 'buscando' | 'listo' | 'enviando' | 'completado'

const estadoStyles: Record<string, { bg: string; text: string; label: string }> = {
  borrador:   { bg: 'bg-slate-800', text: 'text-slate-400', label: 'Borrador' },
  procesando: { bg: 'bg-blue-950', text: 'text-blue-400', label: 'Procesando' },
  activa:     { bg: 'bg-emerald-950', text: 'text-emerald-400', label: 'Activa' },
  pausada:    { bg: 'bg-amber-950', text: 'text-amber-400', label: 'Pausada' },
  completada: { bg: 'bg-slate-800', text: 'text-slate-400', label: 'Completada' },
}

function parseDominios(texto: string): string[] {
  return texto
    .split(/[\n,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
    .filter((d) => d.length > 2 && d.includes('.'))
}

export default function DetalleCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const [campana, setCampana] = useState<Campana | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [fase, setFase] = useState<Fase>('idle')
  const [stats, setStats] = useState({ sinResultados: 0 })
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dominiosTexto, setDominiosTexto] = useState('')

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

  const buscarContactos = async () => {
    if (!campana || dominiosParsed.length === 0) return
    setFase('buscando')

    try {
      const filtros = campana.filtros_hunter
      const res = await fetch('/api/enriquecer-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dominios: dominiosParsed,
          departamentos: filtros?.departamentos || [],
          seniority: filtros?.seniority || [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error buscando contactos')

      if (data.total === 0) {
        setToast({ msg: 'Hunter no encontró contactos en estos dominios. Prueba con otros dominios o amplía los filtros.', tipo: 'info' })
        setFase('idle')
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
      setToast({ msg: `${data2.contactos.length} contactos encontrados en ${dominiosParsed.length} dominios`, tipo: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase('idle')
    }
  }

  const marcarEnviados = async () => {
    setFase('enviando')
    try {
      const res = await fetch('/api/enviar-campana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campana_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ msg: `${data.enviados} contactos marcados como enviados`, tipo: 'success' })
      setFase('completado')
      await cargarCampana()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase('listo')
    }
  }

  const excluirContacto = (contactoId: string) => {
    setContactos((prev) => prev.filter((c) => c.id !== contactoId))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  if (!campana) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-300 font-medium mb-1">Campaña no encontrada</p>
        <Link href="/dashboard/campanas" className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-4">
          ← Volver a campañas
        </Link>
      </div>
    )
  }

  const contactosPendientes = contactos.filter((c) => c.estado === 'pendiente')
  const filtros = campana.filtros_hunter
  const badge = estadoStyles[campana.estado] || estadoStyles.borrador
  const enProceso = fase === 'buscando' || fase === 'enviando'

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#111827] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard/campanas" className="text-slate-500 hover:text-slate-300 text-sm transition-colors shrink-0">
            Campañas
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h1 className="text-sm font-semibold text-white truncate">{campana.nombre}</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {enProceso && (
            <div className="flex items-center gap-2 text-sm text-slate-400 mr-1">
              <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{fase === 'buscando' ? 'Buscando contactos en Hunter...' : 'Procesando...'}</span>
            </div>
          )}
          {fase === 'idle' && (
            <button
              onClick={buscarContactos}
              disabled={dominiosParsed.length === 0}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150"
            >
              Buscar contactos
            </button>
          )}
          {fase === 'listo' && contactosPendientes.length > 0 && (
            <button
              onClick={marcarEnviados}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150"
            >
              Marcar enviados
              <span className="bg-blue-500 text-blue-100 text-xs px-1.5 py-0.5 rounded-full">
                {contactosPendientes.length}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Sector</p>
            <p className="text-sm font-medium text-slate-200 truncate">{campana.sector || '—'}</p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">País</p>
            <p className="text-sm font-medium text-slate-200">
              {PAISES_HUNTER.find((p) => p.value === campana.pais)?.label || campana.pais || '—'}
            </p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Dominios</p>
            <p className="text-sm font-medium text-slate-200 tabular-nums">
              {dominiosParsed.length > 0 ? dominiosParsed.length : '—'}
            </p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Contactos</p>
            <p className="text-sm font-medium text-slate-200 tabular-nums">{contactos.length}</p>
          </div>
        </div>

        {/* Domain input + filter summary */}
        {(fase === 'idle' || fase === 'buscando') && contactos.length === 0 && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-[#111827] border border-white/5 rounded-lg p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Dominios objetivo
              </p>
              <p className="text-xs text-slate-600 mb-3">
                Pega los dominios de las empresas a prospectar. Uno por línea, o separados por comas.
              </p>
              <textarea
                value={dominiosTexto}
                onChange={(e) => setDominiosTexto(e.target.value)}
                placeholder={'stripe.com\nshopify.com\nvercel.com'}
                rows={8}
                disabled={enProceso}
                className="w-full bg-[#0a0f1e] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-slate-300 placeholder:text-slate-700 font-mono outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 resize-none transition-all duration-150 disabled:opacity-50"
              />
              {dominiosParsed.length > 0 && (
                <p className="text-xs text-slate-600 mt-2">
                  {dominiosParsed.length} dominio{dominiosParsed.length !== 1 ? 's' : ''} detectado{dominiosParsed.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {filtros && (
              <div className="bg-[#111827] border border-white/5 rounded-lg p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Filtros de contacto
                </p>
                <div className="space-y-4 text-sm">
                  {filtros.departamentos?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1.5">Departamentos</p>
                      <div className="flex flex-wrap gap-1">
                        {filtros.departamentos.map((d) => (
                          <span key={d} className="bg-blue-600/15 border border-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                            {DEPARTAMENTOS_HUNTER[d] || d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {filtros.seniority?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1.5">Seniority</p>
                      <div className="flex flex-wrap gap-1">
                        {filtros.seniority.map((s) => (
                          <span key={s} className="bg-violet-600/15 border border-violet-500/20 text-violet-400 text-xs px-2 py-0.5 rounded-full">
                            {SENIORITY_HUNTER[s] || s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {filtros.tamanos?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-600 mb-1.5">Tamaños</p>
                      <div className="flex flex-wrap gap-1">
                        {filtros.tamanos.map((t) => (
                          <span key={t} className="bg-white/5 border border-white/10 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results summary */}
        {contactos.length > 0 && (
          <p className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">{contactos.length} contactos</span>
            {stats.sinResultados > 0 && ` · ${stats.sinResultados} dominios sin resultados`}
          </p>
        )}

        {/* Contacts table */}
        {contactos.length > 0 && (
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
