import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente admin sin cookies — necesario porque lo llaman clientes de email
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// GIF transparente 1x1
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contacto_id } = await params

  // Actualizar contacto solo si está en estado 'enviado' (evitar dobles)
  const { data: contacto } = await supabaseAdmin
    .from('contactos')
    .select('id, estado, campana_id')
    .eq('id', contacto_id)
    .single()

  if (contacto && contacto.estado === 'enviado') {
    await supabaseAdmin
      .from('contactos')
      .update({
        estado: 'abierto',
        fecha_apertura: new Date().toISOString(),
      })
      .eq('id', contacto_id)

    // Actualizar total_abiertos en la campaña contando abiertos reales
    const { count } = await supabaseAdmin
      .from('contactos')
      .select('id', { count: 'exact', head: true })
      .eq('campana_id', contacto.campana_id)
      .eq('estado', 'abierto')

    await supabaseAdmin
      .from('campanas')
      .update({ total_abiertos: (count || 0) + 1 })
      .eq('id', contacto.campana_id)
  }

  return new NextResponse(GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
