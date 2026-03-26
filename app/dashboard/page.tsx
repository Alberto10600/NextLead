import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/dashboard/Header'
import TarjetaEstadistica from '@/components/dashboard/TarjetaEstadistica'
import Badge from '@/components/ui/Badge'
import type { Perfil, Campana } from '@/types'
import { formatearFecha, calcularTasaApertura } from '@/lib/utils'

const estadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  borrador:   'default',
  procesando: 'info',
  activa:     'success',
  pausada:    'warning',
  completada: 'default',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { data: campanas }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    supabase
      .from('campanas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const listaCampanas = (campanas || []) as Campana[]
  const totalEnviados = listaCampanas.reduce((s, c) => s + c.total_enviados, 0)
  const totalAbiertos = listaCampanas.reduce((s, c) => s + c.total_abiertos, 0)
  const totalRespondidos = listaCampanas.reduce((s, c) => s + c.total_respondidos, 0)
  const campañasActivas = listaCampanas.filter((c) => c.estado === 'activa').length

  return (
    <div>
      <Header perfil={perfil as Perfil} titulo="Dashboard" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <TarjetaEstadistica titulo="Campañas activas"  valor={campañasActivas} icono="◎" />
          <TarjetaEstadistica titulo="Emails enviados"   valor={totalEnviados}   icono="✉" />
          <TarjetaEstadistica
            titulo="Tasa de apertura"
            valor={calcularTasaApertura(totalEnviados, totalAbiertos)}
            subtitulo={`${totalAbiertos} abiertos`}
            icono="◉"
          />
          <TarjetaEstadistica
            titulo="Respuestas"
            valor={totalRespondidos}
            subtitulo={totalEnviados > 0 ? `${Math.round((totalRespondidos / totalEnviados) * 100)}% tasa` : '—'}
            icono="↩"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200">Últimas campañas</h2>
            <Link href="/dashboard/campanas/nueva" className="text-sm text-blue-400 hover:text-blue-300">
              + Nueva campaña
            </Link>
          </div>

          {listaCampanas.length === 0 ? (
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-12 text-center">
              <p className="text-slate-400 mb-4">Aún no tienes campañas</p>
              <Link
                href="/dashboard/campanas/nueva"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
              >
                Crear primera campaña
              </Link>
            </div>
          ) : (
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Sector</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Enviados</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {listaCampanas.map((c) => (
                    <tr key={c.id} className="border-b border-[#334155] hover:bg-[#334155]/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/campanas/${c.id}`} className="text-slate-200 hover:text-blue-400 transition-colors">
                          {c.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{c.sector}</td>
                      <td className="px-4 py-3">
                        <Badge variant={estadoBadge[c.estado] || 'default'}>{c.estado}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{c.total_enviados}</td>
                      <td className="px-4 py-3 text-slate-500">{formatearFecha(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
