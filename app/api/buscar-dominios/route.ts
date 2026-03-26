import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarDominios } from '@/lib/claude'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { sector, pais, cargos_objetivo } = body

  if (!sector || !pais) {
    return NextResponse.json({ error: 'Sector y país son obligatorios' }, { status: 400 })
  }

  try {
    const dominios = await generarDominios(sector, pais)
    return NextResponse.json({ dominios })
  } catch (e: unknown) {
    const err = e as Error
    console.error('Error generando dominios:', err)
    return NextResponse.json(
      { error: 'No se pudieron generar dominios. Intenta con un sector más específico.' },
      { status: 500 }
    )
  }
}
