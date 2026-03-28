import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY no configurada')
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = () => process.env.RESEND_FROM_EMAIL || 'noreply@arrivo.es'
const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://arrivo.es'

export interface EnvioEmail {
  to: string
  asunto: string
  cuerpo: string
  nombreRemitente?: string
  contacto_id?: string
}

export interface ResultadoEnvio {
  id?: string
  error?: string
  rebotado?: boolean
}

function buildHtml(cuerpo: string, contacto_id?: string): string {
  const pixelUrl = contacto_id
    ? `${APP_URL()}/api/track/open/${contacto_id}`
    : null

  const pixel = pixelUrl
    ? `<img src="${pixelUrl}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`
    : ''

  const body = cuerpo
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#333333;max-width:580px;margin:0 auto;padding:24px 16px;">
${body}
</div>
${pixel}
</body>
</html>`
}

export async function enviarEmail(params: EnvioEmail): Promise<ResultadoEnvio> {
  try {
    const tags = params.contacto_id
      ? [{ name: 'contacto_id', value: params.contacto_id }]
      : undefined

    const { data, error } = await getResend().emails.send({
      from: params.nombreRemitente ? `${params.nombreRemitente} <${FROM()}>` : FROM(),
      to: params.to,
      subject: params.asunto,
      html: buildHtml(params.cuerpo, params.contacto_id),
      tags,
    })

    if (error) {
      return { error: error.message }
    }

    return { id: data?.id }
  } catch (e: unknown) {
    const err = e as Error
    return { error: err.message }
  }
}
