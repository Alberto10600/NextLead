import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarEmailProspeccion } from '@/lib/claude'
import { scrapearWeb } from '@/lib/scraper'
import { sleep } from '@/lib/utils'
import type { Contacto } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { contactos, descripcion_agencia, sector, campana_id } = body

  if (!contactos || !descripcion_agencia || !sector || !campana_id) {
    return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 })
  }

  const errores: string[] = []
  const contactosProcesados: Contacto[] = []

  for (const contacto of contactos as Contacto[]) {
    await sleep(500)

    // Scraping del dominio (no bloqueante)
    let contextoWeb: string | null = null
    if (contacto.dominio) {
      contextoWeb = await scrapearWeb(contacto.dominio)
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
      })

      // Guardar contacto en Supabase
      const { data, error } = await supabase
        .from('contactos')
        .insert({
          user_id: user.id,
          campana_id,
          nombre: contacto.nombre,
          apellido: contacto.apellido,
          cargo: contacto.cargo,
          email: contacto.email,
          empresa: contacto.empresa,
          dominio: contacto.dominio,
          linkedin_url: contacto.linkedin_url,
          contexto_web: contextoWeb,
          asunto_generado: email.asunto,
          email_generado: email.cuerpo,
          estado: 'pendiente',
        })
        .select()
        .single()

      if (error) {
        errores.push(`Error guardando contacto ${contacto.email}: ${error.message}`)
        continue
      }

      contactosProcesados.push(data as Contacto)
    } catch (e: unknown) {
      const err = e as Error
      errores.push(`Error generando email para ${contacto.email}: ${err.message}`)

      // Guardar contacto con estado error
      await supabase.from('contactos').insert({
        user_id: user.id,
        campana_id,
        nombre: contacto.nombre,
        apellido: contacto.apellido,
        cargo: contacto.cargo,
        email: contacto.email,
        empresa: contacto.empresa,
        dominio: contacto.dominio,
        estado: 'error',
      })
    }
  }

  // Actualizar contador total_contactos en campaña
  await supabase
    .from('campanas')
    .update({
      total_contactos: contactosProcesados.length,
      estado: 'activa',
    })
    .eq('id', campana_id)

  return NextResponse.json({
    contactos_procesados: contactosProcesados,
    errores,
    total: contactosProcesados.length,
  })
}
