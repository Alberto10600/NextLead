import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const [{ data: campana }, { data: contactos }, { data: seguimientos }] = await Promise.all([
    supabase
      .from('campanas')
      .select('id, nombre, sector, estado, total_enviados, total_abiertos, total_respondidos, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('contactos')
      .select('id, estado, fecha_envio, fecha_apertura, fecha_respuesta, empresa, dominio')
      .eq('campana_id', id)
      .eq('user_id', user.id),
    supabase
      .from('seguimientos')
      .select('id, estado, numero_seguimiento, fecha_programada, fecha_enviado')
      .eq('campana_id', id)
      .eq('user_id', user.id),
  ])

  if (!campana) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  const cs = contactos || []
  const segs = seguimientos || []

  // --- Funnel ---
  const total = cs.length
  const enviados = cs.filter((c) => c.estado !== 'pendiente' && c.estado !== 'error').length
  const abiertos = cs.filter((c) => ['abierto', 'respondido'].includes(c.estado)).length
  const respondidos = cs.filter((c) => c.estado === 'respondido').length
  const rebotados = cs.filter((c) => c.estado === 'rebotado').length
  const errores = cs.filter((c) => c.estado === 'error').length
  const pendientes = cs.filter((c) => c.estado === 'pendiente').length

  // --- Timeline de aperturas por día ---
  const porDia: Record<string, { enviados: number; abiertos: number; respondidos: number }> = {}

  for (const c of cs) {
    if (c.fecha_envio) {
      const dia = c.fecha_envio.slice(0, 10)
      if (!porDia[dia]) porDia[dia] = { enviados: 0, abiertos: 0, respondidos: 0 }
      porDia[dia].enviados++
    }
    if (c.fecha_apertura) {
      const dia = c.fecha_apertura.slice(0, 10)
      if (!porDia[dia]) porDia[dia] = { enviados: 0, abiertos: 0, respondidos: 0 }
      porDia[dia].abiertos++
    }
    if (c.fecha_respuesta) {
      const dia = c.fecha_respuesta.slice(0, 10)
      if (!porDia[dia]) porDia[dia] = { enviados: 0, abiertos: 0, respondidos: 0 }
      porDia[dia].respondidos++
    }
  }

  const timeline = Object.entries(porDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, vals]) => ({ fecha, ...vals }))

  // --- Tiempo medio hasta apertura (horas) ---
  const tiemposApertura = cs
    .filter((c) => c.fecha_envio && c.fecha_apertura)
    .map((c) => (new Date(c.fecha_apertura!).getTime() - new Date(c.fecha_envio!).getTime()) / 3_600_000)

  const tiempoMedioApertura = tiemposApertura.length
    ? Math.round(tiemposApertura.reduce((a, b) => a + b, 0) / tiemposApertura.length)
    : null

  // --- Seguimientos ---
  const segsEnviados = segs.filter((s) => s.estado === 'enviado').length
  const segsPendientes = segs.filter((s) => s.estado === 'pendiente').length
  const segsCancelados = segs.filter((s) => s.estado === 'cancelado').length

  const segsPorNumero = [1, 2, 3].map((n) => ({
    numero: n,
    enviados: segs.filter((s) => s.numero_seguimiento === n && s.estado === 'enviado').length,
    pendientes: segs.filter((s) => s.numero_seguimiento === n && s.estado === 'pendiente').length,
    cancelados: segs.filter((s) => s.numero_seguimiento === n && s.estado === 'cancelado').length,
  }))

  return NextResponse.json({
    campana,
    funnel: { total, pendientes, enviados, abiertos, respondidos, rebotados, errores },
    tasas: {
      apertura: enviados > 0 ? Math.round((abiertos / enviados) * 100) : 0,
      respuesta: enviados > 0 ? Math.round((respondidos / enviados) * 100) : 0,
      rebote: enviados > 0 ? Math.round((rebotados / enviados) * 100) : 0,
    },
    tiempoMedioAperturaHoras: tiempoMedioApertura,
    timeline,
    seguimientos: { enviados: segsEnviados, pendientes: segsPendientes, cancelados: segsCancelados, porNumero: segsPorNumero },
  })
}
