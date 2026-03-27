import type { Contacto } from '@/types'
import Badge from '@/components/ui/Badge'
import { formatearFecha } from '@/lib/utils'

interface TarjetaContactoProps {
  contacto: Contacto
}

const estadoBadge: Record<Contacto['estado'], 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pendiente:  'default',
  enviado:    'info',
  abierto:    'warning',
  respondido: 'success',
  rebotado:   'error',
  error:      'error',
}

export default function TarjetaContacto({ contacto }: TarjetaContactoProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {[contacto.nombre, contacto.apellido].filter(Boolean).join(' ') || contacto.email}
          </p>
          <p className="text-xs text-gray-500">{contacto.cargo} · {contacto.empresa}</p>
        </div>
        <Badge variant={estadoBadge[contacto.estado]}>{contacto.estado}</Badge>
      </div>

      <p className="text-xs text-gray-400 font-mono">{contacto.email}</p>

      {contacto.asunto_generado && (
        <p className="text-xs text-gray-500 italic truncate">"{contacto.asunto_generado}"</p>
      )}

      {contacto.fecha_envio && (
        <p className="text-xs text-gray-400">Enviado: {formatearFecha(contacto.fecha_envio)}</p>
      )}
    </div>
  )
}
