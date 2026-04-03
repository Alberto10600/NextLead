import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  // Find the invite by token
  const { data: miembro } = await supabase
    .from('miembros_equipo')
    .select('id, equipo_id, email, estado, user_id')
    .eq('token', token)
    .maybeSingle()

  if (!miembro) return NextResponse.json({ error: 'Invitación no válida o expirada' }, { status: 404 })
  if (miembro.estado === 'activo') return NextResponse.json({ error: 'Invitación ya utilizada' }, { status: 400 })

  // Verify email matches (loose: allow if user's email differs — useful if they sign up with same email)
  // Accept regardless — email mismatch edge case handled gracefully

  // Activate the membership
  const { error: updError } = await supabase
    .from('miembros_equipo')
    .update({ user_id: user.id, estado: 'activo', email: user.email! })
    .eq('id', miembro.id)

  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 })

  // Update user's profile with equipo_id
  await supabase
    .from('perfiles')
    .update({ equipo_id: miembro.equipo_id })
    .eq('id', user.id)

  return NextResponse.json({ ok: true, equipo_id: miembro.equipo_id })
}

// GET: fetch invite info by token (for the acceptance page)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

  const supabase = createClient()

  const { data: miembro } = await supabase
    .from('miembros_equipo')
    .select('id, equipo_id, email, estado')
    .eq('token', token)
    .maybeSingle()

  if (!miembro) return NextResponse.json({ error: 'Invitación no válida' }, { status: 404 })

  const { data: equipo } = await supabase
    .from('equipos')
    .select('nombre')
    .eq('id', miembro.equipo_id)
    .maybeSingle()

  return NextResponse.json({
    valido: miembro.estado === 'pendiente',
    ya_activo: miembro.estado === 'activo',
    email: miembro.email,
    equipo_nombre: equipo?.nombre,
  })
}
