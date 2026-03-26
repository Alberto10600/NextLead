import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crearPortalCliente } from '@/lib/stripe'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!perfil?.stripe_customer_id) {
    return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 })
  }

  try {
    const url = await crearPortalCliente(perfil.stripe_customer_id)
    return NextResponse.json({ url })
  } catch (e: unknown) {
    const err = e as Error
    console.error('Error creando portal:', err)
    return NextResponse.json({ error: 'Error al abrir portal' }, { status: 500 })
  }
}
