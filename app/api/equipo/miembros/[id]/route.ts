import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE: remove a member from the team
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verify the member belongs to a team owned by current user
  const { data: miembro } = await supabase
    .from('miembros_equipo')
    .select('id, equipo_id, user_id, email')
    .eq('id', params.id)
    .single()

  if (!miembro) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  const { data: equipo } = await supabase
    .from('equipos')
    .select('owner_id')
    .eq('id', miembro.equipo_id)
    .single()

  if (equipo?.owner_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Don't allow removing the owner
  if (miembro.user_id === user.id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo del equipo' }, { status: 400 })
  }

  await supabase.from('miembros_equipo').delete().eq('id', params.id)

  // Clear the user's equipo_id from their profile if they were active
  if (miembro.user_id) {
    await supabase
      .from('perfiles')
      .update({ equipo_id: null })
      .eq('id', miembro.user_id)
  }

  return NextResponse.json({ ok: true })
}
