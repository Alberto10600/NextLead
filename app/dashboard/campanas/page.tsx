import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/dashboard/Header'
import Badge from '@/components/ui/Badge'
import type { Perfil, Campana } from '@/types'
import { formatearFecha } from '@/lib/utils'

const estadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  borrador:   'default',
  procesando: 'info',
  activa:     'success',
  pausada:    'warning',
  completada: 'default',
}

export default async function CampanasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { data: campanas }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    supabase
      .from('campanas')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const lista = (campanas || []) as Campana[]

  return (
    <div>
      <Header perfil={perfil as Perfil} titulo="Campañas" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-200">Todas las campañas</h2>
            <p className="text-sm text-slate-400">{lista.length} campaña{lista.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/dashboard/campanas/nueva"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            + Nueva campaña
          </Link>
        </div>

        {lista.length === 0 ? (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-16 text-center">
            <p className="text-slate-400 mb-4">Aún no tienes campañas de prospección</p>
            <Link
              href="/dashboard/campanas/nueva"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-3 rounded-md transition-colors"
            >
              Crear primera campaña
            </Link>
          </div>
        ) : (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Campaña</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Sector</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">País</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Contactos</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Enviados</th>
                  <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Creada</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-[#334155] hover:bg-[#334155]/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/campanas/${c.id}`} className="text-slate-200 hover:text-blue-400 font-medium transition-colors">
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.sector}</td>
                    <td className="px-4 py-3 text-slate-400">{c.pais}</td>
                    <td className="px-4 py-3">
                      <Badge variant={estadoBadge[c.estado] || 'default'}>{c.estado}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{c.total_contactos}</td>
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
  )
}
