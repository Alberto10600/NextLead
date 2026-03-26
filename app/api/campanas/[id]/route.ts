import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const [{ data: campana }, { data: contactos }] = await Promise.all([
    supabase
      .from('campanas')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('contactos')
      .select('*')
      .eq('campana_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (!campana) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ campana, contactos: contactos || [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('campanas')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ campana: data })
}
