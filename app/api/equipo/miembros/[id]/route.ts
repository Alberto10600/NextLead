import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: miembro, error: miembroError } = await supabase
    .from('miembros_equipo')
    .select('id, equipo_id, user_id, email')
    .eq('id', params.id)
    .maybeSingle()

  if (miembroError) return NextResponse.json({ error: miembroError.message }, { status: 500 })
  if (!miembro) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  const { data: equipo, error: equipoError } = await supabase
    .from('equipos')
    .select('owner_id')
    .eq('id', miembro.equipo_id)
    .maybeSingle()

  if (equipoError) return NextResponse.json({ error: equipoError.message }, { status: 500 })

  if (equipo?.owner_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (miembro.user_id === user.id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo del equipo' }, { status: 400 })
  }

  const { error: delError } = await supabase.from('miembros_equipo').delete().eq('id', params.id)
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  if (miembro.user_id) {
    await supabase
      .from('perfiles')
      .update({ equipo_id: null })
      .eq('id', miembro.user_id)
  }

  return NextResponse.json({ ok: true })
}
