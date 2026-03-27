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

export default function ModalEmail({ contacto, onClose, onRegenerar }: ModalEmailProps) {
  const [copiado, setCopiado] = useState(false)

  const copiarTodo = () => {
    const texto = `Asunto: ${contacto.asunto_generado}\n\n${contacto.email_generado}`
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Email para ${contacto.nombre || contacto.email}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-400 mb-1 font-medium">ASUNTO</p>
          <p className="text-sm text-slate-200 bg-[#070B14] rounded-md px-3 py-2 border border-white/[0.06]">
            {contacto.asunto_generado}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-1 font-medium">CUERPO</p>
          <div className="text-sm text-slate-300 bg-[#070B14] rounded-md px-3 py-3 border border-white/[0.06] whitespace-pre-wrap leading-relaxed min-h-[120px]">
            {contacto.email_generado}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
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
      </div>
    </Modal>
  )
}
