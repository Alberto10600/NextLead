import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EtapaPipeline } from '@/types'

// GET /api/pipeline — all responded contacts with their pipeline stage
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('contactos')
    .select('*, campanas(sector, nombre)')
    .eq('user_id', user.id)
    .eq('estado', 'respondido')
    .order('fecha_respuesta', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const contactos = (data || []).map((c) => ({
    ...c,
    sector: c.campanas?.sector,
    campana_nombre: c.campanas?.nombre,
    etapa_pipeline: c.etapa_pipeline || 'respondio',
  }))

  return NextResponse.json({ contactos })
}

// PATCH /api/pipeline — update etapa_pipeline and/or notas for a contact
export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { id, etapa_pipeline, notas } = body as { id: string; etapa_pipeline?: EtapaPipeline; notas?: string }

  if (!id) return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 })

  const campos: Record<string, string> = {}
  if (etapa_pipeline) campos.etapa_pipeline = etapa_pipeline
  if (notas !== undefined) campos.notas = notas

  if (Object.keys(campos).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('contactos')
    .update(campos)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contacto: data })
}
