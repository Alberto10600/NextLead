import type { Perfil } from '@/types'
import { LIMITES_PLAN } from '@/types'
import Badge from '@/components/ui/Badge'

interface HeaderProps {
  perfil: Perfil
  titulo?: string
}

export default function Header({ perfil, titulo }: HeaderProps) {
  if (!perfil) return <header className="h-14 border-b border-[#334155] bg-[#1e293b] px-6 flex items-center"><h1 className="text-base font-semibold text-slate-200">{titulo}</h1></header>

  const limite = LIMITES_PLAN[perfil.plan ?? 'free']
  const porcentaje = Math.round(((perfil.creditos_restantes ?? 0) / limite.contactos_mes) * 100)

  return (
    <header className="h-14 border-b border-[#334155] bg-[#1e293b] px-6 flex items-center justify-between">
      <h1 className="text-base font-semibold text-slate-200">{titulo}</h1>

      <div className="flex items-center gap-4">
        {/* Créditos */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-24 h-1.5 bg-[#334155] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>
          <span>{perfil.creditos_restantes} / {limite.contactos_mes} contactos</span>
        </div>

        {/* Plan badge */}
        <Badge variant="plan">{perfil.plan}</Badge>

        {/* Nombre */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {(perfil.nombre || perfil.email)[0].toUpperCase()}
          </div>
          <span className="text-sm text-slate-300">{perfil.nombre || perfil.email}</span>
        </div>
      </div>
    </header>
  )
}
