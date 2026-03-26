import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/dashboard/Header'
import FormularioCampana from '@/components/dashboard/FormularioCampana'
import type { Perfil } from '@/types'

export default async function NuevaCampanaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single()

  return (
    <div>
      <Header perfil={perfil as Perfil} titulo="Nueva campaña" />
      <div className="p-6">
        <FormularioCampana />
      </div>
    </div>
  )
}
