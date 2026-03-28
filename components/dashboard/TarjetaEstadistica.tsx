import Link from 'next/link'

interface TarjetaEstadisticaProps {
  titulo: string
  valor: string | number
  subtitulo?: string
  icono?: string
  href?: string
}

export default function TarjetaEstadistica({ titulo, valor, subtitulo, icono, href }: TarjetaEstadisticaProps) {
  const content = (
    <div className={`group relative bg-white border border-gray-200 rounded-xl p-5 overflow-hidden transition-all duration-200 h-full ${href ? 'hover:border-orange-200 hover:shadow-sm cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{titulo}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight leading-none mt-1">{valor}</p>
          {subtitulo && (
            <p className="text-xs text-gray-400 mt-1.5 tracking-tight">{subtitulo}</p>
          )}
        </div>
        {icono && (
          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-base text-orange-400 flex-shrink-0">
            {icono}
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block h-full focus:outline-none">{content}</Link>
  }
  return content
}
