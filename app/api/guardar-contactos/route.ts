import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LIMITES_PLAN } from '@/types'
import type { Contacto, Plan } from '@/types'

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

  // Verificar límite mensual del plan
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (perfil?.plan || 'free') as Plan
  const limiteMensual = LIMITES_PLAN[plan].contactos_mes

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)

  const { count: usadosMes } = await supabase
    .from('contactos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', inicioMes.toISOString())

  const yaUsados = usadosMes || 0
  const disponibles = limiteMensual - yaUsados

  if (disponibles <= 0) {
    return NextResponse.json({
      error: `Has alcanzado el límite de ${limiteMensual} contactos/mes del plan ${plan}. Actualiza tu plan para continuar.`,
      limite_mensual: limiteMensual,
      ya_usados: yaUsados,
      disponibles: 0,
    }, { status: 429 })
  }

  // Recortar la lista si excede el disponible
  const contactosAGuardar = (contactos as Contacto[]).slice(0, disponibles)
  const enCola = contactos.length - contactosAGuardar.length

  const insertados: Contacto[] = []
  const errores: string[] = []

  for (const c of contactosAGuardar) {
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

  return NextResponse.json({
    contactos: insertados,
    errores,
    en_cola: enCola,
    limite_mensual: limiteMensual,
    ya_usados: yaUsados + insertados.length,
    disponibles: disponibles - insertados.length,
  })
}
