'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import type { Campana } from '@/types'
import { formatearFecha } from '@/lib/utils'

const estadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  borrador:   'default',
  procesando: 'info',
  activa:     'success',
  pausada:    'warning',
  completada: 'default',
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
    <div>
      <div className="h-14 border-b border-[#334155] bg-[#1e293b] px-6 flex items-center justify-between">
        <h1 className="text-base font-semibold text-slate-200">Campañas</h1>
        <Link
          href="/dashboard/campanas/nueva"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
        >
          + Nueva campaña
        </Link>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : campanas.length === 0 ? (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-16 text-center">
            <p className="text-slate-400 mb-4">Aún no tienes campañas</p>
            <Link
              href="/dashboard/campanas/nueva"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-3 rounded-md transition-colors"
            >
              Crear primera campaña
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">{campanas.length} campaña{campanas.length !== 1 ? 's' : ''}</p>
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Campaña</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Sector</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Contactos</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Creada</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {campanas.map((c) => (
                    <tr key={c.id} className="border-b border-[#334155] hover:bg-[#334155]/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/campanas/${c.id}`} className="text-slate-200 hover:text-blue-400 font-medium transition-colors">
                          {c.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{c.sector}</td>
                      <td className="px-4 py-3">
                        <Badge variant={estadoBadge[c.estado] || 'default'}>{c.estado}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{c.total_contactos}</td>
                      <td className="px-4 py-3 text-slate-500">{formatearFecha(c.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/campanas/${c.id}/editar`)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={eliminando === c.id}
                            onClick={() => eliminar(c.id, c.nombre)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
