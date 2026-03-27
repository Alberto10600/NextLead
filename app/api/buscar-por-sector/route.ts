import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarDominiosPorSector } from '@/lib/claude'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { sector, pais = 'España', cantidad = 15, region } = body

  if (!sector) {
    return NextResponse.json({ error: 'El sector es obligatorio' }, { status: 400 })
  }

  try {
    const dominios = await generarDominiosPorSector(sector, pais, cantidad, region)
    return NextResponse.json({ dominios, total: dominios.length })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
