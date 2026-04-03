import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente admin sin cookies — necesario porque lo llaman clientes de email
function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL no configurada')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// GIF transparente 1x1
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

const GIF_HEADERS = {
  'Content-Type': 'image/gif',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contacto_id } = await params

  const supabaseAdmin = getSupabaseAdmin()

  const { data: contacto } = await supabaseAdmin
    .from('contactos')
    .select('id, estado, campana_id, user_id, total_aperturas')
    .eq('id', contacto_id)
    .single()

  // Solo registrar aperturas para contactos enviados o ya abiertos
  if (!contacto || !['enviado', 'abierto'].includes(contacto.estado)) {
    return new NextResponse(GIF, { status: 200, headers: GIF_HEADERS })
  }

  const nuevoTotal = (contacto.total_aperturas ?? 0) + 1

  // Registrar evento individual de apertura (drill-down)
  await supabaseAdmin.from('eventos_apertura').insert({
    contacto_id,
    campana_id: contacto.campana_id,
    user_id: contacto.user_id,
  })

  // Actualizar contacto
  const updates: Record<string, unknown> = { total_aperturas: nuevoTotal }

  if (contacto.estado === 'enviado') {
    // Primera apertura: cambiar estado y guardar fecha
    updates.estado = 'abierto'
    updates.fecha_apertura = new Date().toISOString()
  }

  // Lead caliente: 2+ aperturas sin responder
  if (nuevoTotal >= 2) {
    updates.es_lead_caliente = true
  }

  await supabaseAdmin.from('contactos').update(updates).eq('id', contacto_id)

  // Actualizar total_abiertos en campaña solo en la primera apertura
  if (contacto.estado === 'enviado') {
    const { count } = await supabaseAdmin
      .from('contactos')
      .select('id', { count: 'exact', head: true })
      .eq('campana_id', contacto.campana_id)
      .in('estado', ['abierto', 'respondido'])

    await supabaseAdmin
      .from('campanas')
      .update({ total_abiertos: (count ?? 0) + 1 })
      .eq('id', contacto.campana_id)
  }

  return new NextResponse(GIF, { status: 200, headers: GIF_HEADERS })
}
