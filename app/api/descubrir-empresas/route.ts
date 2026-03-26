import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { descubrirEmpresas } from '@/lib/hunter'
import type { FiltrosHunter } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { filtros, limite = 20 } = body as { filtros: FiltrosHunter; limite?: number }

  if (!filtros?.sector && !filtros?.pais) {
    return NextResponse.json({ error: 'Especifica al menos sector o país' }, { status: 400 })
  }

  const empresas = await descubrirEmpresas(filtros, limite)

  if (empresas.length === 0) {
    return NextResponse.json(
      { error: 'Hunter no encontró empresas con estos filtros. Prueba a ampliar la búsqueda.' },
      { status: 404 }
    )
  }

  const dominios = empresas
    .map((e) => e.domain)
    .filter((d) => d && d.length > 0)

  return NextResponse.json({
    empresas,
    dominios,
    total: dominios.length,
  })
}
