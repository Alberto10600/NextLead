import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sleep, añadirDias } from '@/lib/utils'
import type { Contacto } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { campana_id, modo = 'test' } = body as { campana_id: string; modo?: 'test' | 'real' }

  if (!campana_id) {
    return NextResponse.json({ error: 'campana_id es obligatorio' }, { status: 400 })
  }

  // Solo contactos pendientes que ya tienen email generado
  const { data: contactos } = await supabase
    .from('contactos')
    .select('*')
    .eq('campana_id', campana_id)
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')
    .not('email_generado', 'is', null)

  if (!contactos || contactos.length === 0) {
    return NextResponse.json({ error: 'No hay contactos pendientes con email generado' }, { status: 404 })
  }

  const sinEmail = (await supabase
    .from('contactos')
    .select('id', { count: 'exact', head: true })
    .eq('campana_id', campana_id)
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')
    .is('email_generado', null)
  ).count || 0

  const errores: string[] = []
  let enviados = 0

  for (const contacto of contactos as Contacto[]) {
    await sleep(50)

    if (modo === 'real') {
      // TODO: integrar Resend aquí cuando esté listo
      // const { data, error } = await resend.emails.send({
      //   from: 'tu@tudominio.com',
      //   to: contacto.email,
      //   subject: contacto.asunto_generado!,
      //   text: contacto.email_generado!,
      // })
    }

    // Marcar como enviado (en modo test no se envía realmente)
    const { error } = await supabase
      .from('contactos')
      .update({
        estado: 'enviado',
        fecha_envio: new Date().toISOString(),
      })
      .eq('id', contacto.id)

    if (error) {
      errores.push(`Error actualizando ${contacto.email}: ${error.message}`)
      continue
    }

    // Registrar en historial
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

  // Actualizar stats de la campaña
  await supabase
    .from('campanas')
    .update({
      total_enviados: enviados,
      estado: enviados > 0 ? 'activa' : 'borrador',
    })
    .eq('id', campana_id)

  return NextResponse.json({
    enviados,
    errores,
    total_contactos: contactos.length,
    sin_email_generado: sinEmail,
    modo,
  })
}
