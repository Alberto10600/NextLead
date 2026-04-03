import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { nombre, sector, pais, descripcion_agencia, tono, dias_seguimiento,
          cargos_objetivo, preferencias_busqueda } = body

  if (!nombre?.trim()) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('campanas')
    .insert({
      user_id: user.id,
      nombre: nombre.trim(),
      sector: sector || '',
      pais: pais || '',
      descripcion_agencia: descripcion_agencia || '',
      cargos_objetivo: cargos_objetivo || [],
      estado: 'borrador',
      ...(tono && { tono }),
      ...(dias_seguimiento && { dias_seguimiento }),
      ...(preferencias_busqueda && { preferencias_busqueda }),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, campana: data })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('campanas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ campanas: data })
}
