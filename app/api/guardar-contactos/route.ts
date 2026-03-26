import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Contacto } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { contactos, campana_id } = body

  if (!contactos || !campana_id) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const insertados: Contacto[] = []
  const errores: string[] = []

  for (const c of contactos as Contacto[]) {
    const { data, error } = await supabase
      .from('contactos')
      .insert({
        user_id: user.id,
        campana_id,
        nombre: c.nombre,
        apellido: c.apellido,
        cargo: c.cargo,
        email: c.email,
        empresa: c.empresa,
        dominio: c.dominio,
        linkedin_url: c.linkedin_url,
        estado: 'pendiente',
      })
      .select()
      .single()

    if (error) {
      errores.push(`Error guardando ${c.email}: ${error.message}`)
    } else {
      insertados.push(data as Contacto)
    }
  }

  // Actualizar total_contactos en la campaña
  await supabase
    .from('campanas')
    .update({ total_contactos: insertados.length, estado: 'activa' })
    .eq('id', campana_id)

  return NextResponse.json({ contactos: insertados, errores })
}
