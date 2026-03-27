import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarEmail } from '@/lib/resend'
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

  // Datos de la campaña y del perfil
  const [{ data: campana }, { data: perfil }] = await Promise.all([
    supabase.from('campanas').select('dias_seguimiento').eq('id', campana_id).single(),
    supabase.from('perfiles').select('nombre, agencia').eq('id', user.id).single(),
  ])

  const nombreRemitente = perfil?.agencia || perfil?.nombre || undefined

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
    await sleep(modo === 'real' ? 300 : 50)

    if (modo === 'real') {
      const resultado = await enviarEmail({
        to: contacto.email,
        asunto: contacto.asunto_generado!,
        cuerpo: contacto.email_generado!,
        nombreRemitente,
        contacto_id: contacto.id,
      })

      if (resultado.error) {
        errores.push(`${contacto.email}: ${resultado.error}`)
        // Marcar como error para no reintentar
        await supabase
          .from('contactos')
          .update({ estado: 'error' })
          .eq('id', contacto.id)
        continue
      }
    }

    // Marcar como enviado
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

    // Programar seguimientos usando días configurados en la campaña
    const diasSeguimiento: number[] = campana?.dias_seguimiento?.length
      ? campana.dias_seguimiento
      : [3, 7, 14]
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
