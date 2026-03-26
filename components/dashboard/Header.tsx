import type { Perfil } from '@/types'

interface HeaderProps {
  perfil?: Perfil | null
  titulo?: string
}

export default function Header({ perfil, titulo }: HeaderProps) {
  const nombre = perfil?.nombre || perfil?.email || ''

  return (
    <header className="h-14 border-b border-[#334155] bg-[#1e293b] px-6 flex items-center justify-between">
      <h1 className="text-base font-semibold text-slate-200">{titulo}</h1>

      {nombre && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
            {nombre[0].toUpperCase()}
          </div>
          <span className="text-sm text-slate-300">{nombre}</span>
        </div>
      )}
    </header>
  )
}
