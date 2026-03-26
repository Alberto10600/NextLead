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
      setToast({
        msg: `${data.procesados} enviados · ${data.cancelados} cancelados`,
        tipo: 'success',
      })
      // Recargar
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
      <div className="border-b border-[#334155] bg-[#1e293b] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-200">Seguimientos</h1>
          <p className="text-xs text-slate-400">{pendientes.length} pendientes de envío</p>
        </div>
        <Button
          onClick={procesarAhora}
          loading={procesando}
          disabled={pendientes.length === 0}
        >
          Procesar ahora
        </Button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando...</div>
        ) : seguimientos.length === 0 ? (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-12 text-center text-slate-400">
            No hay seguimientos programados. Se crean automáticamente al enviar una campaña.
          </div>
        ) : (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Seguimiento</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Fecha programada</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Enviado</th>
                </tr>
              </thead>
              <tbody>
                {seguimientos.map((s) => (
                  <tr key={s.id} className="border-b border-[#334155] hover:bg-[#334155]/30 transition-colors">
                    <td className="px-4 py-3 text-slate-300">
                      {s.contactos ? `${s.contactos.nombre || ''} ${s.contactos.apellido || ''}`.trim() || s.contactos.email : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{s.contactos?.empresa || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">#{s.numero_seguimiento}</td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoBadge[s.estado] || 'default'}>{s.estado}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatearFecha(s.fecha_programada)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {s.fecha_enviado ? formatearFecha(s.fecha_enviado) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
