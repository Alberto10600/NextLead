'use client'

import { useState } from 'react'
import type { Contacto } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface ModalEmailProps {
  contacto: Contacto
  onClose: () => void
  onRegenerar?: () => void
}

type Tab = 'email' | 'analisis'

export default function ModalEmail({ contacto, onClose, onRegenerar }: ModalEmailProps) {
  const [copiado, setCopiado] = useState(false)
  const [tab, setTab] = useState<Tab>('email')
  const [analizando, setAnalizando] = useState(false)
  const [analisis, setAnalisis] = useState<{ actividad: string; tamano: string; dolor: string; resumen: string } | null>(
    () => {
      if (!contacto.contexto_web) return null
      try {
        // contexto_web puede ser texto plano o JSON de análisis
        const parsed = JSON.parse(contacto.contexto_web)
        if (parsed.actividad) return parsed
      } catch { /* es texto plano */ }
      return null
    }
  )

  const copiarTodo = () => {
    const texto = `Asunto: ${contacto.asunto_generado}\n\n${contacto.email_generado}`
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const cargarAnalisis = async () => {
    if (!contacto.dominio) return
    setAnalizando(true)
    try {
      const res = await fetch('/api/analizar-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dominio: contacto.dominio }),
      })
      const data = await res.json()
      if (res.ok) setAnalisis(data.analisis)
    } finally {
      setAnalizando(false)
    }
  }

  const tieneAnalisis = !!analisis
  const tabs: { id: Tab; label: string }[] = [
    { id: 'email', label: 'Email generado' },
    { id: 'analisis', label: 'Análisis empresa' },
  ]

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${contacto.nombre || contacto.email}${contacto.empresa ? ` · ${contacto.empresa}` : ''}`}
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 -mt-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'analisis' && !tieneAnalisis) cargarAnalisis() }}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'email' && (
          <>
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Asunto</p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                {contacto.asunto_generado || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Cuerpo</p>
              <div className="text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-3 border border-gray-200 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                {contacto.email_generado || '—'}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button onClick={copiarTodo} variant="primary" size="sm">
                {copiado ? '✓ Copiado' : 'Copiar todo'}
              </Button>
              {onRegenerar && (
                <Button onClick={onRegenerar} variant="secondary" size="sm">
                  Regenerar
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="sm" className="ml-auto">
                Cerrar
              </Button>
            </div>
          </>
        )}

        {tab === 'analisis' && (
          <div className="space-y-3">
            {analizando ? (
              <div className="flex items-center gap-2 py-8 justify-center text-gray-400 text-sm">
                <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Analizando {contacto.dominio}...
              </div>
            ) : analisis ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Actividad</p>
                    <p className="text-xs text-gray-700">{analisis.actividad}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tamaño</p>
                    <p className="text-xs text-gray-700">{analisis.tamano}</p>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-orange-500 uppercase tracking-wider mb-1">Punto de dolor detectado</p>
                  <p className="text-xs text-gray-700">{analisis.dolor}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Resumen</p>
                  <p className="text-xs text-gray-700 leading-relaxed">{analisis.resumen}</p>
                </div>
                <button
                  onClick={cargarAnalisis}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Regenerar análisis
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No hay análisis guardado para esta empresa</p>
                {contacto.dominio ? (
                  <Button onClick={cargarAnalisis} variant="secondary" size="sm">
                    Analizar {contacto.dominio}
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400">Sin dominio disponible</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
