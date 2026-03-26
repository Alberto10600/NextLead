import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarEmail } from '@/lib/resend'
import { sleep, añadirDias } from '@/lib/utils'
import type { Perfil, Contacto } from '@/types'

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

  // Verificar créditos del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!perfil) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  // Obtener contactos pendientes
  const { data: contactos } = await supabase
    .from('contactos')
    .select('*')
    .eq('campana_id', campana_id)
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')

  if (!contactos || contactos.length === 0) {
    return NextResponse.json({ error: 'No hay contactos pendientes de envío' }, { status: 404 })
  }

  // Verificar créditos suficientes
  const perfilData = perfil as Perfil
  if (perfilData.creditos_restantes < contactos.length) {
    return NextResponse.json(
      {
        error: 'Créditos insuficientes',
        creditos_restantes: perfilData.creditos_restantes,
        contactos_a_enviar: contactos.length,
      },
      { status: 402 }
    )
  }

  const errores: string[] = []
  let enviados = 0

  for (const contacto of contactos as Contacto[]) {
    await sleep(200)

    if (!contacto.asunto_generado || !contacto.email_generado) {
      errores.push(`Contacto ${contacto.email} sin email generado`)
      continue
    }

    const resultado = await enviarEmail({
      to: contacto.email,
      asunto: contacto.asunto_generado,
      cuerpo: contacto.email_generado,
    })

    if (resultado.error) {
      errores.push(`Error enviando a ${contacto.email}: ${resultado.error}`)

      await supabase
        .from('contactos')
        .update({ estado: 'error' })
        .eq('id', contacto.id)
      continue
    }

    // Actualizar estado del contacto
    await supabase
      .from('contactos')
      .update({
        estado: 'enviado',
        fecha_envio: new Date().toISOString(),
      })
      .eq('id', contacto.id)

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

    // Decrementar créditos
    await supabase
      .from('perfiles')
      .update({ creditos_restantes: perfilData.creditos_restantes - enviados - 1 })
      .eq('id', user.id)

    // Programar seguimientos según el plan
    const maxSeguimientos = 3 // ajustar según plan en producción
    const diasSeguimiento = [3, 7, 14]

    for (let i = 0; i < maxSeguimientos; i++) {
      const fechaProgramada = añadirDias(new Date(), diasSeguimiento[i])
      await supabase.from('seguimientos').insert({
        contacto_id: contacto.id,
        campana_id,
        user_id: user.id,
        numero_seguimiento: i + 1,
        estado: 'pendiente',
        fecha_programada: fechaProgramada.toISOString(),
      })
    }

    enviados++
  }

  // Actualizar total_enviados en campaña
  await supabase
    .from('campanas')
    .update({ total_enviados: enviados })
    .eq('id', campana_id)

  return NextResponse.json({ enviados, errores, total_contactos: contactos.length })
}
