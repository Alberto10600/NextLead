import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarEmail } from '@/lib/resend'
import { generarEmailSeguimiento } from '@/lib/claude'
import type { Contacto, Seguimiento } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { modo = 'test' } = body as { modo?: 'test' | 'real' }

  // Perfil del usuario para el remitente
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, agencia')
    .eq('id', user.id)
    .single()

  const nombreRemitente = perfil?.agencia || perfil?.nombre || undefined

  let query = supabase
    .from('seguimientos')
    .select('*, contactos(*), campanas(descripcion_agencia)')
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')

  // In test mode show all pending follow-ups regardless of scheduled date
  // In real mode only process follow-ups due now or overdue
  if (modo === 'real') {
    query = query.lte('fecha_programada', new Date().toISOString())
  }

  const { data: seguimientos } = await query

  if (!seguimientos || seguimientos.length === 0) {
    return NextResponse.json({ procesados: 0, cancelados: 0, mensaje: 'No hay seguimientos pendientes' })
  }

  let procesados = 0
  let cancelados = 0
  const errores: string[] = []

  for (const seg of seguimientos as (Seguimiento & { contactos: Contacto; campanas: { descripcion_agencia: string } })[]) {
    const contacto = seg.contactos

    // Si el contacto respondió, cancelar todos sus seguimientos
    if (contacto.estado === 'respondido') {
      await supabase.from('seguimientos').update({ estado: 'cancelado' }).eq('id', seg.id)
      cancelados++
      continue
    }

    // En modo real: generar contenido si no existe y enviar email
    // En modo test: marcar directamente como enviado sin generar contenido ni enviar email
    if (modo === 'real') {
      let asunto = seg.asunto
      let cuerpo = seg.cuerpo

      if (!asunto || !cuerpo) {
        try {
          const descripcionAgencia = seg.campanas?.descripcion_agencia || ''
          const emailAnterior = contacto.email_generado || ''
          const generated = await generarEmailSeguimiento({
            nombre: contacto.nombre,
            empresa: contacto.empresa,
            emailAnterior,
            numeroSeguimiento: seg.numero_seguimiento,
            descripcionAgencia,
          })
          asunto = generated.asunto
          cuerpo = generated.cuerpo

          // Guardar el contenido generado
          await supabase
            .from('seguimientos')
            .update({ asunto, cuerpo })
            .eq('id', seg.id)
        } catch (e: unknown) {
          errores.push(`Error generando seguimiento para ${contacto.email}: ${(e as Error).message}`)
          continue
        }
      }

      const resultado = await enviarEmail({
        to: contacto.email,
        asunto: asunto!,
        cuerpo: cuerpo!,
        nombreRemitente,
        contacto_id: contacto.id,
      })

      if (resultado.error) {
        errores.push(`Error enviando a ${contacto.email}: ${resultado.error}`)
        continue
      }
    }

    // Marcar como enviado
    await supabase
      .from('seguimientos')
      .update({ estado: 'enviado', fecha_enviado: new Date().toISOString() })
      .eq('id', seg.id)

    await supabase
      .from('contactos')
      .update({ numero_seguimiento: seg.numero_seguimiento })
      .eq('id', contacto.id)

    procesados++
  }

  return NextResponse.json({ procesados, cancelados, errores, modo })
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: seguimientos } = await supabase
    .from('seguimientos')
    .select('*, contactos(id, nombre, apellido, email, empresa, cargo, dominio, estado, asunto_generado, email_generado, fecha_envio, fecha_apertura, fecha_respuesta, notas)')
    .eq('user_id', user.id)
    .order('fecha_programada', { ascending: true })

  return NextResponse.json({ seguimientos: seguimientos || [] })
}
