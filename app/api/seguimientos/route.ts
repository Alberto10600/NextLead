import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Contacto, Seguimiento } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: seguimientos } = await supabase
    .from('seguimientos')
    .select('*, contactos(*)')
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')
    .lte('fecha_programada', new Date().toISOString())

  if (!seguimientos || seguimientos.length === 0) {
    return NextResponse.json({ procesados: 0, cancelados: 0, mensaje: 'No hay seguimientos pendientes' })
  }

  let procesados = 0
  let cancelados = 0

  for (const seguimiento of seguimientos as (Seguimiento & { contactos: Contacto })[]) {
    const contacto = seguimiento.contactos

    if (contacto.estado === 'respondido') {
      await supabase.from('seguimientos').update({ estado: 'cancelado' }).eq('id', seguimiento.id)
      cancelados++
      continue
    }

    // Marcar como enviado (sin Resend por ahora)
    await supabase
      .from('seguimientos')
      .update({ estado: 'enviado', fecha_enviado: new Date().toISOString() })
      .eq('id', seguimiento.id)

    await supabase
      .from('contactos')
      .update({ numero_seguimiento: seguimiento.numero_seguimiento })
      .eq('id', contacto.id)

    procesados++
  }

  return NextResponse.json({ procesados, cancelados })
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
