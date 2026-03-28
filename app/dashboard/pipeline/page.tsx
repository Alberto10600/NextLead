'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Contacto, EtapaPipeline } from '@/types'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'

type ContactoPipeline = Contacto & { campana_nombre?: string }

const ETAPAS: { id: EtapaPipeline; label: string; color: string; bg: string; border: string }[] = [
  { id: 'respondio',        label: 'Respondió',        color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { id: 'call_agendada',    label: 'Call agendada',    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { id: 'propuesta_enviada',label: 'Propuesta enviada',color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'negociando',       label: 'Negociando',       color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  { id: 'cerrado_ganado',   label: 'Cerrado ✓',        color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200' },
  { id: 'cerrado_perdido',  label: 'Cerrado ✗',        color: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200' },
]

function formatFecha(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function KanbanCard({
  contacto,
  etapas,
  onMove,
  onNotasSave,
}: {
  contacto: ContactoPipeline
  etapas: typeof ETAPAS
  onMove: (id: string, etapa: EtapaPipeline) => void
  onNotasSave: (id: string, notas: string) => void
}) {
  const [editandoNotas, setEditandoNotas] = useState(false)
  const [notas, setNotas] = useState(contacto.notas || '')
  const [verEmail, setVerEmail] = useState(false)
  const etapaActual = etapas.findIndex((e) => e.id === (contacto.etapa_pipeline || 'respondio'))

  const guardarNotas = () => {
    onNotasSave(contacto.id, notas)
    setEditandoNotas(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {contacto.nombre ? `${contacto.nombre} ${contacto.apellido || ''}`.trim() : contacto.email}
          </p>
          {contacto.empresa && (
            <p className="text-xs text-gray-500 truncate">{contacto.empresa}</p>
          )}
        </div>
        {contacto.sector && (
          <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
            {contacto.sector.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Cargo */}
      {contacto.cargo && (
        <p className="text-xs text-gray-400 mb-2 truncate">{contacto.cargo}</p>
      )}

      {/* Campaña */}
      {contacto.campana_nombre && (
        <p className="text-[10px] text-gray-300 mb-2 truncate">📣 {contacto.campana_nombre}</p>
      )}

      {/* Fecha respuesta */}
      {contacto.fecha_respuesta && (
        <p className="text-[10px] text-gray-400 mb-3">
          Respondió el {formatFecha(contacto.fecha_respuesta)}
        </p>
      )}

      {/* Email enviado */}
      {contacto.email_generado && (
        <div className="mb-3">
          <button
            onClick={() => setVerEmail((v) => !v)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            {verEmail ? 'Ocultar email' : 'Ver email enviado'}
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${verEmail ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {verEmail && (
            <div className="mt-1.5 bg-gray-50 border border-gray-100 rounded p-2">
              {contacto.asunto_generado && (
                <p className="text-[10px] font-semibold text-gray-500 mb-1 truncate">
                  Asunto: {contacto.asunto_generado}
                </p>
              )}
              <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line line-clamp-6">
                {contacto.email_generado}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notas */}
      <div className="mb-3">
        {editandoNotas ? (
          <div className="space-y-1.5">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas sobre este contacto..."
              rows={3}
              className="w-full text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-700 placeholder:text-gray-300 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none"
              autoFocus
            />
            <div className="flex gap-1.5">
              <button
                onClick={guardarNotas}
                className="text-[10px] font-medium text-white bg-orange-500 hover:bg-orange-600 px-2 py-1 rounded transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => { setEditandoNotas(false); setNotas(contacto.notas || '') }}
                className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditandoNotas(true)}
            className="w-full text-left"
          >
            {notas ? (
              <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1.5 hover:bg-gray-100 transition-colors line-clamp-2">{notas}</p>
            ) : (
              <p className="text-xs text-gray-300 hover:text-gray-400 transition-colors">+ Añadir nota</p>
            )}
          </button>
        )}
      </div>

      {/* Move buttons */}
      <div className="flex gap-1 pt-2 border-t border-gray-100">
        {etapaActual > 0 && (
          <button
            onClick={() => onMove(contacto.id, etapas[etapaActual - 1].id)}
            className="flex-1 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded px-1.5 py-1 transition-colors flex items-center justify-center gap-1"
            title={`Mover a: ${etapas[etapaActual - 1].label}`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span className="truncate">{etapas[etapaActual - 1].label}</span>
          </button>
        )}
        {etapaActual < etapas.length - 1 && (
          <button
            onClick={() => onMove(contacto.id, etapas[etapaActual + 1].id)}
            className="flex-1 text-[10px] font-medium text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded px-1.5 py-1 transition-colors flex items-center justify-center gap-1"
            title={`Mover a: ${etapas[etapaActual + 1].label}`}
          >
            <span className="truncate">{etapas[etapaActual + 1].label}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [contactos, setContactos] = useState<ContactoPipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [filtroEtapa, setFiltroEtapa] = useState<EtapaPipeline | 'todas'>('todas')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/pipeline')
    const data = await res.json()
    setContactos(data.contactos || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const moverEtapa = async (id: string, etapa: EtapaPipeline) => {
    // Optimistic update
    setContactos((prev) => prev.map((c) => c.id === id ? { ...c, etapa_pipeline: etapa } : c))

    const res = await fetch('/api/pipeline', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, etapa_pipeline: etapa }),
    })
    if (!res.ok) {
      setToast({ msg: 'Error actualizando etapa', tipo: 'error' })
      cargar() // revert
    }
  }

  const guardarNotas = async (id: string, notas: string) => {
    setContactos((prev) => prev.map((c) => c.id === id ? { ...c, notas } : c))

    const res = await fetch('/api/pipeline', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notas }),
    })
    if (!res.ok) {
      setToast({ msg: 'Error guardando nota', tipo: 'error' })
    }
  }

  const etapasVisibles = filtroEtapa === 'todas'
    ? ETAPAS
    : ETAPAS.filter((e) => e.id === filtroEtapa)

  const totalPorEtapa = ETAPAS.reduce((acc, e) => {
    acc[e.id] = contactos.filter((c) => (c.etapa_pipeline || 'respondio') === e.id).length
    return acc
  }, {} as Record<EtapaPipeline, number>)

  const totalGanados = totalPorEtapa['cerrado_ganado'] || 0
  const totalActivos = contactos.filter(
    (c) => !['cerrado_ganado', 'cerrado_perdido'].includes(c.etapa_pipeline || 'respondio')
  ).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">Pipeline</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {contactos.length} oportunidades · {totalActivos} activas · {totalGanados} cerradas ganadas
          </p>
        </div>
        {/* Filtro rápido por etapa */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFiltroEtapa('todas')}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${filtroEtapa === 'todas' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-700 border border-gray-200'}`}
          >
            Todas
          </button>
          {ETAPAS.map((e) => (
            <button
              key={e.id}
              onClick={() => setFiltroEtapa(e.id)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${filtroEtapa === e.id ? `${e.bg} ${e.color} border ${e.border}` : 'text-gray-500 hover:text-gray-700 border border-gray-200'}`}
            >
              {e.label}
              {totalPorEtapa[e.id] > 0 && (
                <span className="ml-1.5 font-semibold">{totalPorEtapa[e.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {contactos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <rect x="3" y="3" width="4" height="18" rx="1"/>
                <rect x="10" y="3" width="4" height="13" rx="1"/>
                <rect x="17" y="3" width="4" height="8" rx="1"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">Sin oportunidades aún</p>
            <p className="text-xs text-gray-400">Cuando un contacto responda a tu email aparecerá aquí automáticamente.</p>
          </div>
        </div>
      ) : (
        /* Kanban board */
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-6 h-full min-w-max">
            {etapasVisibles.map((etapa) => {
              const tarjetas = contactos.filter(
                (c) => (c.etapa_pipeline || 'respondio') === etapa.id
              )
              return (
                <div key={etapa.id} className="flex flex-col w-64 shrink-0">
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg mb-3 ${etapa.bg} border ${etapa.border}`}>
                    <span className={`text-xs font-semibold ${etapa.color}`}>{etapa.label}</span>
                    <span className={`text-xs font-bold ${etapa.color} bg-white/60 rounded-full w-5 h-5 flex items-center justify-center`}>
                      {tarjetas.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2.5 flex-1">
                    {tarjetas.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 flex items-center justify-center">
                        <p className="text-xs text-gray-300">Vacío</p>
                      </div>
                    ) : (
                      tarjetas.map((c) => (
                        <KanbanCard
                          key={c.id}
                          contacto={c}
                          etapas={ETAPAS}
                          onMove={moverEtapa}
                          onNotasSave={guardarNotas}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
