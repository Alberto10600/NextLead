import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarEmailProspeccion } from '@/lib/claude'
import { scrapearWeb } from '@/lib/scraper'
import { sleep } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { contacto_ids, descripcion_agencia, sector, tono = 'cercano' } = body as {
    contacto_ids: string[]
    descripcion_agencia: string
    sector: string
    tono?: string
  }

  if (!contacto_ids?.length || !descripcion_agencia || !sector) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const { data: contactos, error: fetchErr } = await supabase
    .from('contactos')
    .select('*')
    .in('id', contacto_ids)
    .eq('user_id', user.id)

  if (fetchErr || !contactos) {
    return NextResponse.json({ error: 'Error leyendo contactos' }, { status: 500 })
  }

  let generados = 0
  const errores: string[] = []

  for (const contacto of contactos) {
    await sleep(300)

    let contextoWeb: string | null = null
    if (contacto.dominio) {
      contextoWeb = await scrapearWeb(contacto.dominio).catch(() => null)
    }

    try {
      const email = await generarEmailProspeccion({
        nombre: contacto.nombre,
        apellido: contacto.apellido,
        cargo: contacto.cargo,
        empresa: contacto.empresa,
        sector,
        contextoWeb: contextoWeb || undefined,
        descripcionAgencia: descripcion_agencia,
        tono,
      })

      await supabase
        .from('contactos')
        .update({
          asunto_generado: email.asunto,
          email_generado: email.cuerpo,
          contexto_web: contextoWeb,
        })
        .eq('id', contacto.id)
        .eq('user_id', user.id)

      generados++
    } catch (e: unknown) {
      errores.push(`${contacto.email}: ${(e as Error).message}`)
    }
  }

  return NextResponse.json({ generados, errores, total: contactos.length })
}
