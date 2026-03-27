import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const campos: Record<string, unknown> = {}

  if (body.estado) campos.estado = body.estado
  if (body.notas !== undefined) campos.notas = body.notas
  if (body.estado === 'respondido') campos.fecha_respuesta = new Date().toISOString()

  const { data, error } = await supabase
    .from('contactos')
    .update(campos)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si se marca como respondido, cancelar seguimientos pendientes
  if (body.estado === 'respondido') {
    await supabase
      .from('seguimientos')
      .update({ estado: 'cancelado' })
      .eq('contacto_id', id)
      .eq('estado', 'pendiente')
  }

  return NextResponse.json({ contacto: data })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [{ data: contacto }, { data: seguimientos }] = await Promise.all([
    supabase.from('contactos').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('seguimientos').select('*').eq('contacto_id', id).order('numero_seguimiento'),
  ])

  if (!contacto) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ contacto, seguimientos: seguimientos || [] })
}
