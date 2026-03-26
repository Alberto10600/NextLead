import type { Perfil } from '@/types'

interface HeaderProps {
  perfil?: Perfil | null
  titulo?: string
}

export default function Header({ perfil, titulo }: HeaderProps) {
  const nombre = perfil?.nombre || perfil?.email || ''
  const inicial = nombre ? nombre[0].toUpperCase() : ''

  return (
    <header className="h-14 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-white">{titulo}</h1>
      </div>

      {nombre && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/8 transition-colors duration-150 cursor-default">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              {inicial}
            </div>
            <span className="text-sm text-slate-300 tracking-tight">{nombre}</span>
          </div>
        </div>
      )}
    </header>
  )
}
