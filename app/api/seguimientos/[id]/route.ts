import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generarEmailSeguimiento } from '@/lib/claude'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const { estado, accion } = body

  // Action: generate follow-up content via AI and save it
  if (accion === 'generar') {
    // Fetch the seguimiento with its contact and campaign
    const { data: seg, error: segError } = await supabase
      .from('seguimientos')
      .select('*, contactos(*), campanas(descripcion_agencia)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (segError || !seg) {
      return NextResponse.json({ error: 'Seguimiento no encontrado' }, { status: 404 })
    }

    const contacto = seg.contactos
    if (!contacto) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })
    }

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

      const { error: updateError } = await supabase
        .from('seguimientos')
        .update({ asunto: generated.asunto, cuerpo: generated.cuerpo })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

      return NextResponse.json({ ok: true, asunto: generated.asunto, cuerpo: generated.cuerpo })
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
  }

  // Default action: update estado
  if (!estado || !['cancelado', 'pendiente'].includes(estado)) {
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  }

  const { error } = await supabase
    .from('seguimientos')
    .update({ estado })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
