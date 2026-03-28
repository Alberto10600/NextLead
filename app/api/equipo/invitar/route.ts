import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY no configurada')
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'noreply@arrivo.es'
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://arrivo.es'

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email requerido' }, { status: 400 })

  const emailNorm = email.trim().toLowerCase()
  if (emailNorm === user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'No puedes invitarte a ti mismo' }, { status: 400 })
  }

  // Get owner's team
  const { data: equipo } = await supabase
    .from('equipos')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!equipo) return NextResponse.json({ error: 'No tienes un equipo. Créalo primero.' }, { status: 400 })

  // Get inviter name
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, agencia')
    .eq('id', user.id)
    .single()

  const inviterName = perfil?.nombre || perfil?.agencia || user.email

  // Upsert: if already invited just return ok (resend token)
  const { data: existente } = await supabase
    .from('miembros_equipo')
    .select('id, token, estado')
    .eq('equipo_id', equipo.id)
    .eq('email', emailNorm)
    .single()

  if (existente?.estado === 'activo') {
    return NextResponse.json({ error: 'Este usuario ya pertenece al equipo' }, { status: 400 })
  }

  let token: string
  if (existente) {
    token = existente.token
  } else {
    const { data: nuevo, error } = await supabase
      .from('miembros_equipo')
      .insert({
        equipo_id: equipo.id,
        email: emailNorm,
        rol: 'miembro',
        estado: 'pendiente',
        invited_by: user.id,
      })
      .select('token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    token = nuevo.token
  }

  // Send invite email
  const inviteUrl = `${APP_URL()}/equipo/unirse?token=${token}`

  try {
    await getResend().emails.send({
      from: FROM(),
      to: emailNorm,
      subject: `${inviterName} te invita a unirte al equipo "${equipo.nombre}" en Arrivo`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fff;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#333;max-width:540px;margin:0 auto;padding:40px 24px;">
  <div style="margin-bottom:24px;">
    <span style="display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:16px;color:#111;">
      ⚡ Arrivo
    </span>
  </div>
  <h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px;">Te han invitado a un equipo</h2>
  <p style="margin:0 0 8px;"><strong>${inviterName}</strong> te ha invitado a unirte al equipo <strong>"${equipo.nombre}"</strong> en Arrivo.</p>
  <p style="margin:0 0 24px;color:#666;">Arrivo es una plataforma de prospección B2B automatizada. Al aceptar, podrás ver y colaborar en las campañas del equipo.</p>
  <a href="${inviteUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:600;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">
    Aceptar invitación →
  </a>
  <p style="margin:24px 0 0;font-size:12px;color:#999;">O copia este enlace en tu navegador:<br>${inviteUrl}</p>
  <p style="margin:16px 0 0;font-size:12px;color:#bbb;">Si no esperabas esta invitación, puedes ignorar este email.</p>
</div>
</body>
</html>`,
    })
  } catch {
    // Email failed but member record created — not fatal
  }

  return NextResponse.json({ ok: true, token })
}
