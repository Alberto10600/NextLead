import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarEmailSeguimiento } from '@/lib/claude'
import { enviarEmail } from '@/lib/resend'
import { sleep } from '@/lib/utils'
import type { Contacto, Seguimiento } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Obtener seguimientos pendientes con fecha <= ahora
  const { data: seguimientos } = await supabase
    .from('seguimientos')
    .select('*, contactos(*)')
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')
    .lte('fecha_programada', new Date().toISOString())

  if (!seguimientos || seguimientos.length === 0) {
    return NextResponse.json({ procesados: 0, mensaje: 'No hay seguimientos pendientes' })
  }

  // Obtener descripción de agencia del perfil
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('agencia')
    .eq('id', user.id)
    .single()

  let procesados = 0
  let cancelados = 0
  const errores: string[] = []

  for (const seguimiento of seguimientos as (Seguimiento & { contactos: Contacto })[]) {
    await sleep(500)

    const contacto = seguimiento.contactos

    // Si el contacto ya respondió, cancelar seguimiento
    if (contacto.estado === 'respondido') {
      await supabase
        .from('seguimientos')
        .update({ estado: 'cancelado' })
        .eq('id', seguimiento.id)
      cancelados++
      continue
    }

    try {
      const email = await generarEmailSeguimiento({
        nombre: contacto.nombre,
        empresa: contacto.empresa,
        emailAnterior: contacto.email_generado || '',
        numeroSeguimiento: seguimiento.numero_seguimiento,
        descripcionAgencia: perfil?.agencia || 'nuestra agencia de marketing',
      })

      const resultado = await enviarEmail({
        to: contacto.email,
        asunto: email.asunto,
        cuerpo: email.cuerpo,
      })

      if (resultado.error) {
        errores.push(`Error enviando seguimiento a ${contacto.email}: ${resultado.error}`)
        continue
      }

      // Actualizar seguimiento como enviado
      await supabase
        .from('seguimientos')
        .update({
          asunto: email.asunto,
          cuerpo: email.cuerpo,
          estado: 'enviado',
          fecha_enviado: new Date().toISOString(),
        })
        .eq('id', seguimiento.id)

      // Actualizar número de seguimiento en contacto
      await supabase
        .from('contactos')
        .update({ numero_seguimiento: seguimiento.numero_seguimiento })
        .eq('id', contacto.id)

      procesados++
    } catch (e: unknown) {
      const err = e as Error
      errores.push(`Error procesando seguimiento ${seguimiento.id}: ${err.message}`)
    }
  }

  return NextResponse.json({ procesados, cancelados, errores })
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: seguimientos } = await supabase
    .from('seguimientos')
    .select('*, contactos(nombre, apellido, email, empresa)')
    .eq('user_id', user.id)
    .order('fecha_programada', { ascending: true })

  return NextResponse.json({ seguimientos: seguimientos || [] })
}
