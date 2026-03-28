import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { añadirDias } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { campana_id } = body as { campana_id: string }

  if (!campana_id) return NextResponse.json({ error: 'campana_id requerido' }, { status: 400 })

  // Get campaign follow-up days
  const { data: campana } = await supabase
    .from('campanas')
    .select('dias_seguimiento')
    .eq('id', campana_id)
    .eq('user_id', user.id)
    .single()

  const diasSeguimiento: number[] = campana?.dias_seguimiento?.length ? campana.dias_seguimiento : [3, 7, 14]

  // Get all sent contacts for this campaign
  const { data: contactos } = await supabase
    .from('contactos')
    .select('id')
    .eq('campana_id', campana_id)
    .eq('user_id', user.id)
    .in('estado', ['enviado', 'abierto'])

  if (!contactos?.length) {
    return NextResponse.json({ creados: 0, mensaje: 'No hay contactos enviados en esta campaña' })
  }

  // Find which contacts already have pending follow-ups
  const { data: existentes } = await supabase
    .from('seguimientos')
    .select('contacto_id')
    .eq('campana_id', campana_id)
    .eq('user_id', user.id)
    .eq('estado', 'pendiente')

  const conSeguimiento = new Set((existentes || []).map((s) => s.contacto_id))
  const sinSeguimiento = contactos.filter((c) => !conSeguimiento.has(c.id))

  if (sinSeguimiento.length === 0) {
    return NextResponse.json({ creados: 0, mensaje: 'Todos los contactos enviados ya tienen seguimientos pendientes' })
  }

  let creados = 0
  for (const contacto of sinSeguimiento) {
    for (let i = 0; i < diasSeguimiento.length; i++) {
      const { error } = await supabase.from('seguimientos').insert({
        contacto_id: contacto.id,
        campana_id,
        user_id: user.id,
        numero_seguimiento: i + 1,
        estado: 'pendiente',
        fecha_programada: añadirDias(new Date(), diasSeguimiento[i]).toISOString(),
      })
      if (!error) creados++
    }
  }

  return NextResponse.json({ creados, contactos_afectados: sinSeguimiento.length })
}
