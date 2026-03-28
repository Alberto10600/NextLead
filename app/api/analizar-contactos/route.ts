import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analizarEmpresa } from '@/lib/claude'
import { scrapearWeb } from '@/lib/scraper'
import { sleep } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { contacto_ids } = body as { contacto_ids: string[] }

  if (!contacto_ids?.length) {
    return NextResponse.json({ error: 'Faltan contacto_ids' }, { status: 400 })
  }

  const { data: contactos } = await supabase
    .from('contactos')
    .select('id, dominio, analisis_empresa')
    .in('id', contacto_ids)
    .eq('user_id', user.id)

  if (!contactos?.length) {
    return NextResponse.json({ error: 'Contactos no encontrados' }, { status: 404 })
  }

  // Agrupar por dominio para no analizar el mismo dominio dos veces
  const dominiosAnalizados = new Map<string, { actividad?: string; tamano?: string; dolor?: string; resumen?: string }>()
  let analizados = 0
  const errores: string[] = []

  for (const contacto of contactos) {
    if (!contacto.dominio) continue
    // Skip if already have analysis
    if (contacto.analisis_empresa) {
      dominiosAnalizados.set(contacto.dominio, contacto.analisis_empresa)
      continue
    }

    await sleep(300)

    let analisis = dominiosAnalizados.get(contacto.dominio)

    if (!analisis) {
      try {
        const contextoWeb = await scrapearWeb(contacto.dominio).catch(() => null)
        if (contextoWeb) {
          const raw = await analizarEmpresa(contacto.dominio, contextoWeb)
          analisis = JSON.parse(raw)
          dominiosAnalizados.set(contacto.dominio, analisis!)
        }
      } catch (e: unknown) {
        errores.push(`${contacto.dominio}: ${(e as Error).message}`)
        continue
      }
    }

    if (analisis) {
      await supabase
        .from('contactos')
        .update({ analisis_empresa: analisis })
        .eq('id', contacto.id)
        .eq('user_id', user.id)
      analizados++
    }
  }

  return NextResponse.json({ analizados, errores, total: contactos.length })
}
