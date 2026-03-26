'use client'

import { useState } from 'react'
import type { Contacto } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
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

export default function TablaContactos({ contactos, onExcluir, onRegenerar }: TablaContactosProps) {
  const [contactoSeleccionado, setContactoSeleccionado] = useState<Contacto | null>(null)

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto)
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-[#334155]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155] bg-[#1e293b]">
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Empresa</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Nombre</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Cargo</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Asunto</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {contactos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
                <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate" title={c.asunto_generado}>
                  {c.asunto_generado || '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={estadoBadge[c.estado]}>{c.estado}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {c.email_generado && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContactoSeleccionado(c)}
                      >
                        Ver
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copiar(`${c.asunto_generado}\n\n${c.email_generado}`)}
                    >
                      Copiar
                    </Button>
                    {onExcluir && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExcluir(c.id)}
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
