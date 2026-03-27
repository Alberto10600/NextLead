import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function maskHunterKey(key: string | null | undefined): string | undefined {
  if (!key) return undefined
  return `••••••••${key.slice(-4)}`
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const perfil = { ...data, hunter_api_key: maskHunterKey(data.hunter_api_key) }
  return NextResponse.json({ perfil })
}

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const campos: Record<string, string> = {}
  if (typeof body.nombre === 'string') campos.nombre = body.nombre.trim()
  if (typeof body.agencia === 'string') campos.agencia = body.agencia.trim()
  if (typeof body.hunter_api_key === 'string') campos.hunter_api_key = body.hunter_api_key.trim()

  if (Object.keys(campos).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('perfiles')
    .update(campos)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const perfil = { ...data, hunter_api_key: maskHunterKey(data.hunter_api_key) }
  return NextResponse.json({ perfil })
}
