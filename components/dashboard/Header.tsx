import type { Perfil } from '@/types'

interface HeaderProps {
  perfil?: Perfil | null
  titulo?: string
}

export default function Header({ perfil, titulo }: HeaderProps) {
  const nombre = perfil?.nombre || perfil?.email || ''
  const inicial = nombre ? nombre[0].toUpperCase() : ''

  return (
    <header className="h-14 border-b border-white/[0.06] bg-[#070B14]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-slate-100">{titulo}</h1>
      </div>

      {nombre && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors duration-150 cursor-default">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              {inicial}
            </div>
            <span className="text-sm text-slate-400 tracking-tight">{nombre}</span>
          </div>
        </div>
      )}
    </header>
  )
}
