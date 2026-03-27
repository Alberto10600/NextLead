import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analizarEmpresa } from '@/lib/claude'
import { scrapearWeb } from '@/lib/scraper'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { dominio } = await request.json()
  if (!dominio) return NextResponse.json({ error: 'dominio requerido' }, { status: 400 })

  const contextoWeb = await scrapearWeb(dominio).catch(() => null)
  if (!contextoWeb) {
    return NextResponse.json({ error: 'No se pudo acceder a la web' }, { status: 422 })
  }

  try {
    const analisisRaw = await analizarEmpresa(dominio, contextoWeb)
    const analisis = JSON.parse(analisisRaw)
    return NextResponse.json({ analisis, contexto_web: contextoWeb })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
