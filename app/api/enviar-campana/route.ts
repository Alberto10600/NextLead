import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sleep, añadirDias } from '@/lib/utils'
import type { Contacto } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { campana_id } = body

  if (!campana_id) {
    return NextResponse.json({ error: 'campana_id es obligatorio' }, { status: 400 })
  }

  const { data: contactos } = await supabase
    .from('contactos')
    .select('*')
    .eq('campana_id', campana_id)
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')

  if (!contactos || contactos.length === 0) {
    return NextResponse.json({ error: 'No hay contactos pendientes de envío' }, { status: 404 })
  }

  const errores: string[] = []
  let enviados = 0

  for (const contacto of contactos as Contacto[]) {
    await sleep(50)

    if (!contacto.asunto_generado || !contacto.email_generado) {
      errores.push(`Contacto ${contacto.email} sin email generado`)
      continue
    }

    // Marcar como enviado (sin Resend por ahora)
    const { error } = await supabase
      .from('contactos')
      .update({ estado: 'enviado', fecha_envio: new Date().toISOString() })
      .eq('id', contacto.id)

    if (error) {
      errores.push(`Error actualizando ${contacto.email}`)
      continue
    }

    // Registrar en historial para deduplicación futura
    await supabase
      .from('historial_contactos')
      .upsert({
        user_id: user.id,
        email: contacto.email,
        dominio: contacto.dominio || '',
        fecha_ultimo_contacto: new Date().toISOString(),
        total_contactos: 1,
      }, { onConflict: 'user_id,email' })

    // Programar seguimientos
    const diasSeguimiento = [3, 7, 14]
    for (let i = 0; i < diasSeguimiento.length; i++) {
      await supabase.from('seguimientos').insert({
        contacto_id: contacto.id,
        campana_id,
        user_id: user.id,
        numero_seguimiento: i + 1,
        estado: 'pendiente',
        fecha_programada: añadirDias(new Date(), diasSeguimiento[i]).toISOString(),
      })
    }

    enviados++
  }

  await supabase
    .from('campanas')
    .update({ total_enviados: enviados, estado: 'completada' })
    .eq('id', campana_id)

  return NextResponse.json({ enviados, errores, total_contactos: contactos.length })
}
