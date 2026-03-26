import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { enviarEmail } from '@/lib/resend'
import type { Plan } from '@/types'

const CREDITOS_POR_PLAN: Record<Plan, number> = {
  free:     25,
  starter:  600,
  pro:      1500,
  business: 3000,
}

function planDesdePrecio(priceId: string): Plan {
  if (priceId === process.env.STRIPE_PRICE_STARTER)  return 'starter'
  if (priceId === process.env.STRIPE_PRICE_PRO)      return 'pro'
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return 'business'
  return 'free'
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: unknown) {
    const err = e as Error
    console.error('Webhook error:', err.message)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan as Plan

        if (userId && plan) {
          await supabase
            .from('perfiles')
            .update({
              plan,
              stripe_subscription_id: session.subscription as string,
              creditos_restantes: CREDITOS_POR_PLAN[plan],
            })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const priceId = subscription.items.data[0]?.price.id
        const plan = planDesdePrecio(priceId)

        await supabase
          .from('perfiles')
          .update({ plan, creditos_restantes: CREDITOS_POR_PLAN[plan] })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        await supabase
          .from('perfiles')
          .update({
            plan: 'free',
            creditos_restantes: CREDITOS_POR_PLAN['free'],
            stripe_subscription_id: null,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer as string

        const { data: perfil } = await supabase
          .from('perfiles')
          .select('email')
          .eq('stripe_customer_id', customerId)
          .single()

        if (perfil?.email) {
          await enviarEmail({
            to: perfil.email,
            asunto: 'Problema con tu pago en NextLead',
            cuerpo: `Hola,\n\nHubo un problema al procesar tu pago en NextLead. Por favor, actualiza tu método de pago para continuar usando el servicio.\n\nEntra en nextlead.es/precios para gestionar tu suscripción.\n\nEl equipo de NextLead`,
          })
        }
        break
      }

      default:
        console.log(`Evento no manejado: ${event.type}`)
    }
  } catch (e: unknown) {
    const err = e as Error
    console.error(`Error procesando webhook ${event.type}:`, err.message)
    // No romper el flujo — Stripe reintentará
  }

  return NextResponse.json({ received: true })
}
