import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('plantillas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plantillas: data || [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { nombre, sector = '', descripcion, tono = 'cercano' } = body

  if (!nombre?.trim() || !descripcion?.trim()) {
    return NextResponse.json({ error: 'nombre y descripcion son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('plantillas')
    .insert({ user_id: user.id, nombre: nombre.trim(), sector, descripcion: descripcion.trim(), tono })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ plantilla: data })
}
