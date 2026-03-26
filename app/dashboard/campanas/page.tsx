'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Toast from '@/components/ui/Toast'
import type { Campana } from '@/types'
import { formatearFecha } from '@/lib/utils'

const estadoStyles: Record<string, { bg: string; text: string; label: string }> = {
  borrador:   { bg: 'bg-slate-800/60',   text: 'text-slate-400',   label: 'Borrador' },
  procesando: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    label: 'Procesando' },
  activa:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Activa' },
  pausada:    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   label: 'Pausada' },
  completada: { bg: 'bg-slate-700/40',   text: 'text-slate-400',   label: 'Completada' },
}

export default function CampanasPage() {
  const router = useRouter()
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [loading, setLoading] = useState(true)
  const [eliminando, setEliminando] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch('/api/campanas')
      .then((r) => r.json())
      .then((d) => setCampanas(d.campanas || []))
      .finally(() => setLoading(false))
  }, [])

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la campaña "${nombre}"? Se borrarán también todos sus contactos.`)) return

    setEliminando(id)
    try {
      const res = await fetch(`/api/campanas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setCampanas((prev) => prev.filter((c) => c.id !== id))
      setToast({ msg: 'Campaña eliminada', tipo: 'success' })
    } catch {
      setToast({ msg: 'Error al eliminar la campaña', tipo: 'error' })
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="border-b border-white/5 bg-[#111827] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">Campañas</h1>
          {!loading && campanas.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {campanas.length} campaña{campanas.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/campanas/nueva"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva campaña
        </Link>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-2.5 text-slate-500 text-sm">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Cargando campañas...
            </div>
          </div>
        ) : campanas.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <p className="text-slate-200 font-medium mb-1.5">No tienes campañas todavía</p>
            <p className="text-slate-500 text-sm mb-7 max-w-xs leading-relaxed">
              Crea tu primera campaña para empezar a descubrir contactos con Hunter
            </p>
            <Link
              href="/dashboard/campanas/nueva"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-md transition-colors duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear primera campaña
            </Link>
          </div>
        ) : (
          /* Campaigns table */
          <div className="bg-[#111827] border border-white/5 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-[30%]">
                    Campaña
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider tabular-nums">
                    Contactos
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Creada
                  </th>
                  <th className="px-5 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {campanas.map((c) => {
                  const badge = estadoStyles[c.estado] || estadoStyles.borrador
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors duration-100 group"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/campanas/${c.id}`}
                          className="font-semibold text-white hover:text-blue-400 transition-colors duration-100"
                        >
                          {c.nombre}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{c.sector || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 tabular-nums text-sm">
                        {c.total_contactos ?? 0}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{formatearFecha(c.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => router.push(`/dashboard/campanas/${c.id}/editar`)}
                            className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors duration-100"
                            title="Editar campaña"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => eliminar(c.id, c.nombre)}
                            disabled={eliminando === c.id}
                            className="px-2.5 py-1 text-xs text-red-500/80 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors duration-100 disabled:opacity-40"
                            title="Eliminar campaña"
                          >
                            {eliminando === c.id ? '...' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
