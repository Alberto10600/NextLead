import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crearClienteStripe, crearSesionCheckout } from '@/lib/stripe'
import type { Plan } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { plan } = body as { plan: Plan }

  if (!plan || plan === 'free') {
    return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  }

  // Obtener o crear customer de Stripe
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = perfil?.stripe_customer_id

  if (!customerId) {
    customerId = await crearClienteStripe(user.email!)
    await supabase
      .from('perfiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  try {
    const url = await crearSesionCheckout({
      customerId,
      plan: plan as Exclude<Plan, 'free'>,
      userId: user.id,
    })

    return NextResponse.json({ url })
  } catch (e: unknown) {
    const err = e as Error
    console.error('Error creando sesión checkout:', err)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
