import Link from 'next/link'
import Precios from '@/components/landing/Precios'
import { createClient } from '@/lib/supabase/server'
import type { Perfil } from '@/types'

export default async function PreciosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let planActual = undefined
  if (user) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    planActual = (perfil as Perfil)?.plan
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <header className="border-b border-[#334155] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-blue-500">Next</span>
            <span className="text-slate-200">Lead</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
                Ir al dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      <Precios planActual={planActual} />
    </div>
  )
}
