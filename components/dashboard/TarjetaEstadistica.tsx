interface TarjetaEstadisticaProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  icono?: string
}

export default function TarjetaEstadistica({ titulo, valor, subtitulo, icono }: TarjetaEstadisticaProps) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{titulo}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{valor}</p>
          {subtitulo && <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>}
        </div>
        {icono && (
          <span className="text-2xl text-slate-600">{icono}</span>
        )}
      </div>
    </div>
  )
}
