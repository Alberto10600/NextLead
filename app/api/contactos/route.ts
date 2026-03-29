import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 500)
  const estado = searchParams.get('estado')
  const campanaId = searchParams.get('campana_id')

  let query = supabase
    .from('contactos')
    .select('id, nombre, apellido, email, empresa, cargo, estado, fecha_envio, fecha_apertura, fecha_respuesta, campana_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (estado) query = query.eq('estado', estado)
  if (campanaId) query = query.eq('campana_id', campanaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contactos: data || [] })
}
