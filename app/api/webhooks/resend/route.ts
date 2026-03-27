import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Verificación simple con secret en query param
// Configurar en Resend: https://tu-app.com/api/webhooks/resend?secret=TU_SECRET
function verificarSecret(req: Request): boolean {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  return secret === process.env.RESEND_WEBHOOK_SECRET
}

interface ResendWebhookPayload {
  type: string
  data: {
    email_id?: string
    tags?: { name: string; value: string }[] | Record<string, string>
    to?: string[]
  }
}

function getContactoId(tags: ResendWebhookPayload['data']['tags']): string | null {
  if (!tags) return null
  if (Array.isArray(tags)) {
    return tags.find((t) => t.name === 'contacto_id')?.value || null
  }
  return (tags as Record<string, string>)['contacto_id'] || null
}

export async function POST(req: Request) {
  if (!verificarSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: ResendWebhookPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = payload
  const contacto_id = getContactoId(data?.tags)

  if (!contacto_id) {
    // Evento sin contacto_id asociado (ej: emails transaccionales de Stripe)
    return NextResponse.json({ ok: true })
  }

  switch (type) {
    case 'email.bounced': {
      await supabaseAdmin
        .from('contactos')
        .update({ estado: 'rebotado' })
        .eq('id', contacto_id)
        .in('estado', ['enviado', 'abierto'])

      // Cancelar seguimientos pendientes
      await supabaseAdmin
        .from('seguimientos')
        .update({ estado: 'cancelado' })
        .eq('contacto_id', contacto_id)
        .eq('estado', 'pendiente')
      break
    }

    case 'email.opened': {
      // Backup para clientes que bloquean imágenes pero reportan apertura vía otro mecanismo
      const { data: contacto } = await supabaseAdmin
        .from('contactos')
        .select('estado')
        .eq('id', contacto_id)
        .single()

      if (contacto?.estado === 'enviado') {
        await supabaseAdmin
          .from('contactos')
          .update({
            estado: 'abierto',
            fecha_apertura: new Date().toISOString(),
          })
          .eq('id', contacto_id)
      }
      break
    }

    case 'email.complained': {
      // Marca como no contactar si el destinatario marca como spam
      await supabaseAdmin
        .from('contactos')
        .update({ estado: 'rebotado' })
        .eq('id', contacto_id)

      await supabaseAdmin
        .from('seguimientos')
        .update({ estado: 'cancelado' })
        .eq('contacto_id', contacto_id)
        .eq('estado', 'pendiente')
      break
    }
  }

  return NextResponse.json({ ok: true })
}
