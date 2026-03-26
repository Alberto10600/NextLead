'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'
import { PAISES_HUNTER, DEPARTAMENTOS_HUNTER, SENIORITY_HUNTER } from '@/types'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'

type Fase = 'idle' | 'descubriendo' | 'enriqueciendo' | 'listo' | 'enviando' | 'completado'

const estadoStyles: Record<string, { bg: string; text: string; label: string }> = {
  borrador:   { bg: 'bg-slate-800/60',   text: 'text-slate-400',   label: 'Borrador' },
  procesando: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    label: 'Procesando' },
  activa:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Activa' },
  pausada:    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   label: 'Pausada' },
  completada: { bg: 'bg-slate-700/40',   text: 'text-slate-400',   label: 'Completada' },
}

const faseTexto: Partial<Record<Fase, string>> = {
  descubriendo: 'Buscando empresas en Hunter...',
  enriqueciendo: 'Extrayendo contactos...',
  enviando: 'Procesando...',
}

export default function DetalleCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const [campana, setCampana] = useState<Campana | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [fase, setFase] = useState<Fase>('idle')
  const [progreso, setProgreso] = useState('')
  const [stats, setStats] = useState({ empresas: 0, encontrados: 0, sinResultados: 0 })
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)

  const cargarCampana = useCallback(async () => {
    const res = await fetch(`/api/campanas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCampana(data.campana)
      const lista = data.contactos || []
      setContactos(lista)
      if (lista.length > 0) setFase('listo')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    cargarCampana()
  }, [cargarCampana])

  const buscarContactos = async () => {
    if (!campana) return
    setFase('descubriendo')
    setProgreso('Buscando empresas en Hunter...')

    try {
      // Paso 1: Discover — obtener dominios
      const filtros = campana.filtros_hunter
      const res1 = await fetch('/api/descubrir-empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filtros, limite: 20 }),
      })

      const data1 = await res1.json()

      if (!res1.ok) throw new Error(data1.error || 'Error en Hunter Discover')
      if (!data1.dominios?.length) {
        setToast({ msg: 'Hunter no encontró empresas con estos filtros. Prueba a ampliar la búsqueda.', tipo: 'info' })
        setFase('idle')
        return
      }

      setStats((s) => ({ ...s, empresas: data1.total }))
      setProgreso(`${data1.total} empresas encontradas. Buscando contactos...`)
      setFase('enriqueciendo')

      // Paso 2: Domain Search — buscar contactos en cada dominio
      const res2 = await fetch('/api/enriquecer-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dominios: data1.dominios,
          departamentos: filtros?.departamentos || [],
          seniority: filtros?.seniority || [],
        }),
      })

      const data2 = await res2.json()

      if (!res2.ok) throw new Error(data2.error || 'Error buscando contactos')

      if (data2.total === 0) {
        setToast({ msg: 'Hunter no encontró contactos en estas empresas. Prueba a cambiar departamento o seniority.', tipo: 'info' })
        setFase('idle')
        return
      }

      // Paso 3: Guardar en Supabase
      const res3 = await fetch('/api/guardar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactos: data2.contactos, campana_id: id }),
      })

      const data3 = await res3.json()

      if (!res3.ok) throw new Error(data3.error || 'Error guardando contactos')

      setContactos(data3.contactos)
      setStats({
        empresas: data1.total,
        encontrados: data3.contactos.length,
        sinResultados: data2.dominios_sin_resultados?.length || 0,
      })
      setFase('listo')
      setToast({ msg: `${data3.contactos.length} contactos encontrados en ${data1.total} empresas`, tipo: 'success' })
    } catch (e: unknown) {
      const msg = (e as Error).message
      setToast({ msg, tipo: 'error' })
      setFase('idle')
    }
    setProgreso('')
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
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!campana) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <p className="text-slate-200 font-medium mb-1.5">Campaña no encontrada</p>
        <p className="text-slate-500 text-sm mb-6 max-w-xs leading-relaxed">
          Es posible que haya sido eliminada o el enlace sea incorrecto.
        </p>
        <Link
          href="/dashboard/campanas"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Volver a campañas
        </Link>
      </div>
    )
  }

  const contactosPendientes = contactos.filter((c) => c.estado === 'pendiente')
  const filtros = campana.filtros_hunter
  const badge = estadoStyles[campana.estado] || estadoStyles.borrador
  const enProceso = ['descubriendo', 'enriqueciendo', 'enviando'].includes(fase)

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#111827] px-6 py-4 flex items-center justify-between gap-4">
        {/* Left: breadcrumb + title + badge */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/dashboard/campanas"
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors shrink-0"
          >
            Campañas
          </Link>
          <svg className="w-3.5 h-3.5 text-slate-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h1 className="text-sm font-semibold text-white truncate">{campana.nombre}</h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3 shrink-0">
          {enProceso && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg className="animate-spin w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-xs text-slate-400">{progreso || faseTexto[fase as Fase] || 'Procesando...'}</span>
            </div>
          )}
          {fase === 'idle' && (
            <button
              onClick={buscarContactos}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150"
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
              <span className="bg-blue-500/60 text-blue-100 text-xs px-1.5 py-0.5 rounded-full tabular-nums">
                {contactosPendientes.length}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3.5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Sector</p>
            <p className="text-sm font-medium text-slate-200 truncate">{campana.sector || '—'}</p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3.5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">País</p>
            <p className="text-sm font-medium text-slate-200">
              {PAISES_HUNTER.find((p) => p.value === campana.pais)?.label || campana.pais || '—'}
            </p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3.5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Empresas</p>
            <p className="text-sm font-medium text-slate-200 tabular-nums">
              {stats.empresas > 0 ? stats.empresas : '—'}
            </p>
          </div>
          <div className="bg-[#111827] border border-white/5 rounded-lg px-4 py-3.5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Contactos</p>
            <p className="text-sm font-medium text-slate-200 tabular-nums">{contactos.length}</p>
          </div>
        </div>

        {/* Hunter filters summary — shown only when no contacts yet */}
        {filtros && fase === 'idle' && contactos.length === 0 && (
          <div className="bg-[#111827] border border-white/5 rounded-lg p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Filtros configurados
            </p>
            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
              {filtros.sector && (
                <>
                  <span className="text-xs text-slate-500 self-center">Sector</span>
                  <span className="text-sm text-slate-200">{filtros.sector}</span>
                </>
              )}
              {filtros.pais && (
                <>
                  <span className="text-xs text-slate-500 self-center">País</span>
                  <span className="text-sm text-slate-200">
                    {PAISES_HUNTER.find((p) => p.value === filtros.pais)?.label || filtros.pais}
                  </span>
                </>
              )}
              {filtros.tamanos?.length > 0 && (
                <>
                  <span className="text-xs text-slate-500 self-center">Tamaño empresa</span>
                  <span className="text-sm text-slate-200">{filtros.tamanos.join(', ')}</span>
                </>
              )}
              {filtros.departamentos?.length > 0 && (
                <>
                  <span className="text-xs text-slate-500 self-center">Departamentos</span>
                  <span className="text-sm text-slate-200">
                    {filtros.departamentos.map((d) => DEPARTAMENTOS_HUNTER[d] || d).join(', ')}
                  </span>
                </>
              )}
              {filtros.seniority?.length > 0 && (
                <>
                  <span className="text-xs text-slate-500 self-center">Seniority</span>
                  <span className="text-sm text-slate-200">
                    {filtros.seniority.map((s) => SENIORITY_HUNTER[s] || s).join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Contact summary line */}
        {contactos.length > 0 && (
          <p className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">{contactos.length} contactos</span>
            {stats.empresas > 0 && ` de ${stats.empresas} empresas`}
            {stats.sinResultados > 0 && (
              <span className="text-slate-600"> · {stats.sinResultados} empresas sin contactos</span>
            )}
          </p>
        )}

        {/* Contacts table */}
        {contactos.length > 0 && (
          <TablaContactos
            contactos={contactos}
            onExcluir={['listo', 'completado'].includes(fase) ? excluirContacto : undefined}
          />
        )}

        {/* Progress state */}
        {enProceso && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-8 h-8 mb-5 relative">
              <svg className="animate-spin w-8 h-8 text-blue-500/20" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              </svg>
              <svg className="animate-spin w-8 h-8 text-blue-400 absolute inset-0" fill="none" viewBox="0 0 24 24">
                <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <p className="text-slate-200 font-medium mb-1.5">
              {fase === 'descubriendo' && 'Descubriendo empresas'}
              {fase === 'enriqueciendo' && 'Buscando contactos'}
              {fase === 'enviando' && 'Procesando envíos'}
            </p>
            <p className="text-slate-500 text-sm">{progreso}</p>
          </div>
        )}

        {/* Empty state */}
        {fase === 'idle' && contactos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-200 font-medium mb-1.5">Sin contactos todavía</p>
            <p className="text-slate-500 text-sm mb-7 max-w-sm leading-relaxed">
              Pulsa "Buscar contactos" para que Hunter descubra empresas
              {filtros?.sector ? ` del sector "${filtros.sector}"` : ' con los filtros configurados'} y extraiga sus emails.
            </p>
            <button
              onClick={buscarContactos}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors duration-150"
            >
              Buscar contactos
            </button>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
