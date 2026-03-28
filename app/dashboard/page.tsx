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
    <div className="min-h-screen">
      <Header perfil={perfil as Perfil} titulo="Dashboard" />

      <div className="p-6 space-y-8 max-w-6xl">

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4 items-stretch">
          <TarjetaEstadistica titulo="Campañas activas"  valor={campañasActivas} icono="◎" href="/dashboard/campanas" />
          <TarjetaEstadistica titulo="Emails enviados"   valor={totalEnviados}   icono="✉" href="/dashboard/contactos" />
          <TarjetaEstadistica
            titulo="Tasa de apertura"
            valor={calcularTasaApertura(totalEnviados, totalAbiertos)}
            subtitulo={`${totalAbiertos} abiertos`}
            icono="◉"
            href="/dashboard/seguimientos"
          />
          <TarjetaEstadistica
            titulo="Respuestas"
            valor={totalRespondidos}
            subtitulo={totalEnviados > 0 ? `${Math.round((totalRespondidos / totalEnviados) * 100)}% tasa` : '—'}
            icono="↩"
            href="/dashboard/pipeline"
          />
        </div>

        {/* Recent campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-gray-900">Últimas campañas</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tus 5 campañas más recientes</p>
            </div>
            <Link
              href="/dashboard/campanas/nueva"
              className="flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-all duration-150"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva campaña
            </Link>
          </div>

          {listaCampanas.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-14 text-center">
              <div className="w-12 h-12 rounded-xl bg-orange-400/10 border border-orange-400/20 flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                  <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Aún no tienes campañas</p>
              <p className="text-xs text-gray-400 mb-5">Crea tu primera campaña para empezar a enviar emails</p>
              <Link
                href="/dashboard/campanas/nueva"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-gray-900 text-xs font-medium px-4 py-2 rounded-lg transition-colors duration-150 ring-1 ring-orange-400/40"
              >
                Crear primera campaña
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Nombre</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Sector</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Estado</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Enviados</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {listaCampanas.map((c, i) => (
                    <tr
                      key={c.id}
                      className={`group relative transition-colors duration-100 hover:bg-orange-50/40 ${i < listaCampanas.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/campanas/${c.id}`}
                          className="font-medium tracking-tight text-sm text-gray-800 group-hover:text-orange-600 transition-colors after:absolute after:inset-0 after:z-0"
                        >
                          {c.nombre}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 relative z-10 pointer-events-none">
                        <span className="text-gray-400 text-xs tracking-tight">{c.sector}</span>
                      </td>
                      <td className="px-5 py-3.5 relative z-10 pointer-events-none">
                        <Badge variant={estadoBadge[c.estado] || 'default'}>{c.estado}</Badge>
                      </td>
                      <td className="px-5 py-3.5 relative z-10 pointer-events-none">
                        <span className="text-gray-500 text-sm tabular-nums">{c.total_enviados}</span>
                      </td>
                      <td className="px-5 py-3.5 relative z-10 pointer-events-none">
                        <span className="text-gray-400 text-xs tracking-tight">{formatearFecha(c.created_at)}</span>
                      </td>
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
