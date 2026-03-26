'use client'

import { useState } from 'react'
import type { Contacto } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ModalEmail from './ModalEmail'

interface TablaContactosProps {
  contactos: Contacto[]
  onExcluir?: (id: string) => void
  onRegenerar?: (id: string) => void
}

const estadoBadge: Record<Contacto['estado'], 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pendiente:  'default',
  enviado:    'info',
  abierto:    'warning',
  respondido: 'success',
  rebotado:   'error',
  error:      'error',
}

function descargarCSV(contactos: Contacto[]) {
  const cabecera = ['Empresa', 'Nombre', 'Apellido', 'Cargo', 'Email', 'Dominio', 'LinkedIn', 'Estado']
  const filas = contactos.map((c) => [
    c.empresa || '',
    c.nombre || '',
    c.apellido || '',
    c.cargo || '',
    c.email,
    c.dominio || '',
    c.linkedin_url || '',
    c.estado,
  ])

  const csv = [cabecera, ...filas]
    .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `contactos-nextlead-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TablaContactos({ contactos, onExcluir, onRegenerar }: TablaContactosProps) {
  const [contactoSeleccionado, setContactoSeleccionado] = useState<Contacto | null>(null)

  return (
    <>
      {/* Barra superior con acciones */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-400">{contactos.length} contacto{contactos.length !== 1 ? 's' : ''}</p>
        <Button variant="secondary" size="sm" onClick={() => descargarCSV(contactos)}>
          Descargar CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#334155]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155] bg-[#1e293b]">
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Empresa</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Cargo</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contactos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay contactos aún
                </td>
              </tr>
            )}
            {contactos.map((c) => (
              <tr key={c.id} className="border-b border-[#334155] hover:bg-[#334155]/30 transition-colors">
                <td className="px-4 py-3 text-slate-300">{c.empresa || '—'}</td>
                <td className="px-4 py-3 text-slate-300">
                  {[c.nombre, c.apellido].filter(Boolean).join(' ') || '—'}
                </td>
                <td className="px-4 py-3 text-slate-400">{c.cargo || '—'}</td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{c.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={estadoBadge[c.estado]}>{c.estado}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {c.email_generado && (
                      <Button variant="ghost" size="sm" onClick={() => setContactoSeleccionado(c)}>
                        Ver email
                      </Button>
                    )}
                    {onExcluir && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExcluir(c.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contactoSeleccionado && (
        <ModalEmail
          contacto={contactoSeleccionado}
          onClose={() => setContactoSeleccionado(null)}
          onRegenerar={onRegenerar ? () => {
            onRegenerar(contactoSeleccionado.id)
            setContactoSeleccionado(null)
          } : undefined}
        />
      )}
    </>
  )
}
