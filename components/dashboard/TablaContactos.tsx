'use client'

import { useState } from 'react'
import type { Contacto } from '@/types'
import ModalEmail from './ModalEmail'

interface TablaContactosProps {
  contactos: Contacto[]
  onExcluir?: (id: string) => void
  onRegenerar?: (id: string) => void
}

const estadoStyles: Record<Contacto['estado'], { bg: string; text: string }> = {
  pendiente:  { bg: 'bg-slate-700/40',   text: 'text-slate-400' },
  enviado:    { bg: 'bg-blue-500/10',    text: 'text-blue-400' },
  abierto:    { bg: 'bg-amber-500/10',   text: 'text-amber-400' },
  respondido: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  rebotado:   { bg: 'bg-red-500/10',     text: 'text-red-400' },
  error:      { bg: 'bg-red-500/10',     text: 'text-red-400' },
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
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">
          {contactos.length} contacto{contactos.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => descargarCSV(contactos)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/[0.04] hover:bg-white/[0.07] border border-white/8 rounded-md transition-colors duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-[#111827]">
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Cargo
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-5 py-3 w-24" />
            </tr>
          </thead>
          <tbody>
            {contactos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-slate-500 text-sm">
                  No hay contactos
                </td>
              </tr>
            )}
            {contactos.map((c) => {
              const badge = estadoStyles[c.estado] || estadoStyles.pendiente
              return (
                <tr
                  key={c.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors duration-100 group"
                >
                  <td className="px-5 py-3.5 font-semibold text-white">{c.empresa || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-200">
                    {[c.nombre, c.apellido].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{c.cargo || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-slate-300">{c.email}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                    >
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      {c.email_generado && (
                        <button
                          onClick={() => setContactoSeleccionado(c)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors duration-100"
                        >
                          Ver email
                        </button>
                      )}
                      {onExcluir && (
                        <button
                          onClick={() => onExcluir(c.id)}
                          className="px-2.5 py-1 text-xs text-red-500/80 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors duration-100"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
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
