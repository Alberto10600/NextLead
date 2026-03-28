import Stripe from 'stripe'
import type { Plan } from '@/types'

// Lazy instantiation — avoids "no apiKey" error during Next.js build
function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY no configurada')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia',
  })
}

const PRICE_IDS: Record<Exclude<Plan, 'free'>, string> = {
  starter:  process.env.STRIPE_PRICE_STARTER  || '',
  pro:      process.env.STRIPE_PRICE_PRO      || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
}

// For webhook signature verification
export const stripe = { webhooks: { constructEvent: (...args: Parameters<Stripe['webhooks']['constructEvent']>) => getStripe().webhooks.constructEvent(...args) } }

export function getPriceId(plan: Exclude<Plan, 'free'>): string {
  return PRICE_IDS[plan]
}

export async function crearClienteStripe(email: string): Promise<string> {
  const customer = await getStripe().customers.create({ email })
  return customer.id
}

export async function crearSesionCheckout(params: {
  customerId: string
  plan: Exclude<Plan, 'free'>
  userId: string
}): Promise<string> {
  const session = await getStripe().checkout.sessions.create({
    customer: params.customerId,
    payment_method_types: ['card'],
    line_items: [{ price: getPriceId(params.plan), quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/precios`,
    metadata: { user_id: params.userId, plan: params.plan },
  })

  return session.url!
}

export async function crearPortalCliente(customerId: string): Promise<string> {
  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return session.url
}
