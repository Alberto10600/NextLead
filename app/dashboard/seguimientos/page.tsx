'use client'

import { useState, useEffect } from 'react'
import type { Seguimiento } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import { formatearFecha } from '@/lib/utils'

const estadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pendiente: 'warning',
  enviado:   'success',
  cancelado: 'default',
}

interface SeguimientoConContacto extends Seguimiento {
  contactos?: {
    nombre?: string
    apellido?: string
    email: string
    empresa?: string
  }
}

export default function SeguimientosPage() {
  const [seguimientos, setSeguimientos] = useState<SeguimientoConContacto[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    fetch('/api/seguimientos')
      .then((r) => r.json())
      .then((data) => setSeguimientos(data.seguimientos || []))
      .finally(() => setLoading(false))
  }, [])

  const procesarAhora = async () => {
    setProcesando(true)
    try {
      const res = await fetch('/api/seguimientos', { method: 'POST' })
      const data = await res.json()
      setToast({ msg: `${data.procesados} enviados · ${data.cancelados} cancelados`, tipo: 'success' })
      const res2 = await fetch('/api/seguimientos')
      const data2 = await res2.json()
      setSeguimientos(data2.seguimientos || [])
    } catch {
      setToast({ msg: 'Error al procesar seguimientos', tipo: 'error' })
    } finally {
      setProcesando(false)
    }
  }

  const pendientes = seguimientos.filter((s) => s.estado === 'pendiente')

  return (
    <div>
      <div className="h-14 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-800">Seguimientos</h1>
        </div>
        <div className="flex items-center gap-3">
          {pendientes.length > 0 && (
            <span className="text-xs text-amber-400">{pendientes.length} pendientes</span>
          )}
          <Button onClick={procesarAhora} loading={procesando} disabled={pendientes.length === 0} size="sm">
            Procesar ahora
          </Button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : seguimientos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
            No hay seguimientos programados. Se crean automáticamente al enviar una campaña.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">#</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Programado</th>
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Enviado</th>
                </tr>
              </thead>
              <tbody>
                {seguimientos.map((s) => (
                  <tr key={s.id} className="border-b border-gray-200 hover:bg-[#334155]/30 transition-colors">
                    <td className="px-4 py-3 text-gray-700">
                      {s.contactos
                        ? `${s.contactos.nombre || ''} ${s.contactos.apellido || ''}`.trim() || s.contactos.email
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.contactos?.empresa || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">#{s.numero_seguimiento}</td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatearFecha(s.fecha_programada)}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {s.fecha_enviado ? formatearFecha(s.fecha_enviado) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
