import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/dashboard/Header'
import TablaContactos from '@/components/dashboard/TablaContactos'
import type { Perfil, Contacto } from '@/types'

export default async function ContactosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: perfil }, { data: contactos }] = await Promise.all([
    supabase.from('perfiles').select('*').eq('id', user.id).single(),
    supabase.from('contactos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <Header perfil={perfil as Perfil} titulo="Historial de contactos" />

      <div className="p-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500">{(contactos || []).length} contactos en total</p>
        </div>

        {contactos && contactos.length > 0 ? (
          <TablaContactos contactos={contactos as Contacto[]} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500">
            Aún no tienes contactos. Crea una campaña para empezar.
          </div>
        )}
      </div>
    </div>
  )
}
