'use client'

import { useState } from 'react'
import type { Contacto } from '@/types'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface ModalEmailProps {
  contacto: Contacto
  onClose: () => void
  onRegenerar?: () => void
  onUpdate?: (campos: Partial<Contacto>) => void
}

type Tab = 'email' | 'analisis'

type Analisis = { actividad: string; tamano: string; dolor: string; resumen: string }

function parsearAnalisis(contexto_web?: string): Analisis | null {
  if (!contexto_web) return null
  try {
    const parsed = JSON.parse(contexto_web)
    if (parsed.actividad) return parsed
  } catch { /* texto plano */ }
  return null
}

export default function ModalEmail({ contacto, onClose, onRegenerar, onUpdate }: ModalEmailProps) {
  const [tab, setTab] = useState<Tab>('email')

  // ── Email editor ──────────────────────────────────────────────────
  const [editando, setEditando] = useState(false)
  const [asunto, setAsunto] = useState(contacto.asunto_generado || '')
  const [cuerpo, setCuerpo] = useState(contacto.email_generado || '')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const guardarEmail = async () => {
    setGuardando(true)
    try {
      const res = await fetch(`/api/contactos/${contacto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asunto_generado: asunto, email_generado: cuerpo }),
      })
      if (res.ok) {
        setEditando(false)
        setGuardado(true)
        setTimeout(() => setGuardado(false), 2000)
        onUpdate?.({ asunto_generado: asunto, email_generado: cuerpo })
      }
    } finally {
      setGuardando(false)
    }
  }

  const cancelarEdicion = () => {
    setAsunto(contacto.asunto_generado || '')
    setCuerpo(contacto.email_generado || '')
    setEditando(false)
  }

  const copiarTodo = () => {
    navigator.clipboard.writeText(`Asunto: ${asunto}\n\n${cuerpo}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // ── Análisis empresa ───────────────────────────────────────────────
  const [analizando, setAnalizando] = useState(false)
  const [analisis, setAnalisis] = useState<Analisis | null>(() => parsearAnalisis(contacto.contexto_web))

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
      if (res.ok && data.analisis) {
        setAnalisis(data.analisis)
        // P1-2: guardar en DB para no volver a analizar
        await fetch(`/api/contactos/${contacto.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contexto_web: JSON.stringify(data.analisis) }),
        })
        onUpdate?.({ contexto_web: JSON.stringify(data.analisis) })
      }
    } finally {
      setAnalizando(false)
    }
  }

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
              onClick={() => { setTab(t.id); if (t.id === 'analisis' && !analisis) cargarAnalisis() }}
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
            {/* Asunto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Asunto</p>
                {!editando && (
                  <button
                    onClick={() => setEditando(true)}
                    className="text-xs text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </button>
                )}
              </div>
              {editando ? (
                <input
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  className="w-full text-sm text-gray-800 bg-white border border-orange-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/30"
                />
              ) : (
                <p className="text-sm text-gray-800 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                  {asunto || '—'}
                </p>
              )}
            </div>

            {/* Cuerpo */}
            <div>
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Cuerpo</p>
              {editando ? (
                <textarea
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  rows={8}
                  className="w-full text-sm text-gray-700 bg-white border border-orange-300 rounded-md px-3 py-3 outline-none focus:ring-2 focus:ring-orange-400/30 resize-none leading-relaxed"
                />
              ) : (
                <div className="text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-3 border border-gray-200 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                  {cuerpo || '—'}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 pt-1">
              {editando ? (
                <>
                  <Button onClick={guardarEmail} variant="primary" size="sm" loading={guardando}>
                    Guardar cambios
                  </Button>
                  <Button onClick={cancelarEdicion} variant="ghost" size="sm">
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={copiarTodo} variant="primary" size="sm">
                    {copiado ? '✓ Copiado' : 'Copiar todo'}
                  </Button>
                  {onRegenerar && (
                    <Button onClick={onRegenerar} variant="secondary" size="sm">
                      Regenerar
                    </Button>
                  )}
                  {guardado && (
                    <span className="text-xs text-emerald-600">✓ Guardado</span>
                  )}
                </>
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
