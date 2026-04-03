import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: fetch current user's team + members
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Get the user's profile to check if they're in a team
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('equipo_id')
    .eq('id', user.id)
    .maybeSingle()

  // Case 1: User is the owner of a team
  const { data: equipoOwned } = await supabase
    .from('equipos')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  // Case 2: User is a member of a team
  const equipoId = equipoOwned?.id || perfil?.equipo_id
  if (!equipoId) return NextResponse.json({ equipo: null, miembros: [], esOwner: false })

  const { data: equipo } = equipoOwned
    ? { data: equipoOwned }
    : await supabase.from('equipos').select('*').eq('id', equipoId).maybeSingle()

  const { data: miembros } = await supabase
    .from('miembros_equipo')
    .select('*')
    .eq('equipo_id', equipoId)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    equipo,
    miembros: miembros || [],
    esOwner: equipo?.owner_id === user.id,
  })
}

// POST: create a new team
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Check if user already owns a team
  const { data: existing } = await supabase
    .from('equipos')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Ya tienes un equipo creado' }, { status: 400 })

  const { nombre } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const { data: equipo, error } = await supabase
    .from('equipos')
    .insert({ nombre: nombre.trim(), owner_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add the owner as a member too
  await supabase.from('miembros_equipo').insert({
    equipo_id: equipo.id,
    user_id: user.id,
    email: user.email,
    rol: 'admin',
    estado: 'activo',
    invited_by: user.id,
  })

  // Update owner's profile with equipo_id
  await supabase.from('perfiles').update({ equipo_id: equipo.id }).eq('id', user.id)

  return NextResponse.json({ equipo })
}

// PATCH: rename team
export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { nombre } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })

  const { data, error } = await supabase
    .from('equipos')
    .update({ nombre: nombre.trim() })
    .eq('owner_id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
  return NextResponse.json({ equipo: data })
}
