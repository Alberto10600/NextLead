interface Fase {
  label: string
  completada: boolean
  activa: boolean
}

interface BarraProgresoProps {
  fases: Fase[]
  progreso?: { actual: number; total: number; mensaje?: string }
}

export default function BarraProgreso({ fases, progreso }: BarraProgresoProps) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        {fases.map((fase, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300
                  ${fase.completada ? 'bg-green-600 text-white' :
                    fase.activa ? 'bg-blue-600 text-white animate-pulse' :
                    'bg-[#334155] text-slate-500'}
                `}
              >
                {fase.completada ? '✓' : i + 1}
              </div>
              <span className={`text-xs mt-1 text-center max-w-[80px] leading-tight
                ${fase.activa ? 'text-blue-400' :
                  fase.completada ? 'text-green-400' : 'text-slate-500'}
              `}>
                {fase.label}
              </span>
            </div>
            {i < fases.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all duration-300
                ${fase.completada ? 'bg-green-600' : 'bg-[#334155]'}
              `} />
            )}
          </div>
        ))}
      </div>

      {progreso && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{progreso.mensaje || `Procesando ${progreso.actual} de ${progreso.total}...`}</span>
            <span>{Math.round((progreso.actual / progreso.total) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#334155] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
