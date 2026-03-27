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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-blue-500">Next</span>
            <span className="text-gray-800">Lead</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm text-blue-400 hover:text-blue-300">
                Ir al dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800">
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
