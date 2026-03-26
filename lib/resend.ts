import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL || 'noreply@nextlead.es'

export interface EnvioEmail {
  to: string
  asunto: string
  cuerpo: string
  nombreRemitente?: string
}

export interface ResultadoEnvio {
  id?: string
  error?: string
  rebotado?: boolean
}

export async function enviarEmail(params: EnvioEmail): Promise<ResultadoEnvio> {
  try {
    const { data, error } = await resend.emails.send({
      from: params.nombreRemitente ? `${params.nombreRemitente} <${FROM}>` : FROM,
      to: params.to,
      subject: params.asunto,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6;">${params.cuerpo.replace(/\n/g, '<br>')}</div>`,
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
