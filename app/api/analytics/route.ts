import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [{ data: campanas }, { data: contactos }] = await Promise.all([
    supabase
      .from('campanas')
      .select('id, nombre, estado, sector, total_contactos, total_enviados, total_abiertos, total_respondidos, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contactos')
      .select('id, campana_id, cargo, linkedin_url, estado, fecha_envio, fecha_apertura, fecha_respuesta, numero_seguimiento, created_at')
      .eq('user_id', user.id),
  ])

  return NextResponse.json({
    campanas: campanas || [],
    contactos: contactos || [],
  })
}
