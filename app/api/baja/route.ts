import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL no configurada')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// GET /api/baja?id=<contacto_id>
// Called when a contact clicks the unsubscribe link in an email.
// Uses admin client because the request has no user session.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.redirect(new URL('/baja?estado=invalido', req.url))
  }

  try {
    const supabase = getSupabaseAdmin()

    // Mark contact as no_contactar
    const { error } = await supabase
      .from('contactos')
      .update({ estado: 'no_contactar' })
      .eq('id', id)
      .neq('estado', 'no_contactar') // idempotent

    if (error) {
      return NextResponse.redirect(new URL('/baja?estado=error', req.url))
    }

    return NextResponse.redirect(new URL('/baja?estado=ok', req.url))
  } catch {
    return NextResponse.redirect(new URL('/baja?estado=error', req.url))
  }
}
