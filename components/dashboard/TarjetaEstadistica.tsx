interface TarjetaEstadisticaProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  icono?: string
}

export default function TarjetaEstadistica({ titulo, valor, subtitulo, icono }: TarjetaEstadisticaProps) {
  return (
    <div className="group relative bg-[#111827] border border-white/5 rounded-xl p-5 overflow-hidden transition-all duration-200 hover:border-white/10 hover:bg-[#141d2e]">
      {/* Subtle gradient top accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">{titulo}</p>
          <p className="text-3xl font-bold text-white tracking-tight leading-none mt-1">{valor}</p>
          {subtitulo && (
            <p className="text-xs text-slate-500 mt-1.5 tracking-tight">{subtitulo}</p>
          )}
        </div>
        {icono && (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-base text-blue-400 flex-shrink-0">
            {icono}
          </div>
        )}
      </div>
    </div>
  )
}
