import Anthropic from '@anthropic-ai/sdk'
import { sleep } from './utils'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function generarDominios(sector: string, pais: string): Promise<string[]> {
  const prompt = `Devuelve un JSON con exactamente 10 dominios web reales de empresas en el sector: ${sector} en ${pais}.
Deben ser empresas reales con web activa, de distintos tamaños.
Sin texto adicional, sin markdown, solo JSON:
{"dominios": ["empresa1.es", "empresa2.com", ...]}`

  const intentar = async (): Promise<string[]> => {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(texto.trim())
    if (!Array.isArray(parsed.dominios)) throw new Error('Formato inválido')
    return parsed.dominios
  }

  try {
    return await intentar()
  } catch {
    await sleep(2000)
    return await intentar()
  }
}

export async function generarEmailProspeccion(params: {
  nombre?: string
  apellido?: string
  cargo?: string
  empresa?: string
  sector: string
  contextoWeb?: string
  descripcionAgencia: string
}): Promise<{ asunto: string; cuerpo: string }> {
  const { nombre, apellido, cargo, empresa, sector, contextoWeb, descripcionAgencia } = params

  const contextoLinea = contextoWeb ? `- Web de su empresa: ${contextoWeb}` : ''

  const userPrompt = `Redacta email de prospección B2B en español para:
- Nombre: ${nombre || 'el/la responsable'} ${apellido || ''}
- Cargo: ${cargo || 'responsable de la empresa'}
- Empresa: ${empresa || 'la empresa'}
- Sector: ${sector}
${contextoLinea}
- Mi agencia ofrece: ${descripcionAgencia}

REGLAS:
- Asunto: máximo 8 palabras, directo, sin emojis
- Cuerpo: máximo 120 palabras
- Tono: cercano y directo, nada formal ni corporativo
- Mencionar UN problema concreto conocido del sector
- Terminar con UNA pregunta de respuesta fácil
- NO usar: 'espero', 'estimado', 'adjunto', 'solución', 'innovador', 'sinergias', 'me pongo en contacto'
- NO parecer email masivo

Responde SOLO con este JSON:
{"asunto": "...", "cuerpo": "..."}`

  const intentar = async (): Promise<{ asunto: string; cuerpo: string }> => {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: 'Eres un experto en ventas B2B y copywriting en España. Redactas emails de prospección que consiguen respuesta. Siempre respondes en JSON estricto sin markdown.',
      messages: [{ role: 'user', content: userPrompt }],
    })

    const texto = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(texto.trim())
    if (!parsed.asunto || !parsed.cuerpo) throw new Error('Formato inválido')
    return parsed
  }

  try {
    return await intentar()
  } catch (e: unknown) {
    const error = e as { status?: number }
    if (error?.status === 429) {
      await sleep(3000)
      return await intentar()
    }
    throw e
  }
}

export async function generarEmailSeguimiento(params: {
  nombre?: string
  empresa?: string
  emailAnterior: string
  numeroSeguimiento: number
  descripcionAgencia: string
}): Promise<{ asunto: string; cuerpo: string }> {
  const { nombre, empresa, emailAnterior, numeroSeguimiento, descripcionAgencia } = params

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: 'Eres un experto en ventas B2B. Escribes follow-ups breves y directos. Responde en JSON estricto sin markdown.',
    messages: [{
      role: 'user',
      content: `Escribe un email de seguimiento #${numeroSeguimiento} para ${nombre || 'el contacto'} de ${empresa || 'la empresa'}.
Email anterior enviado: ${emailAnterior}
Mi agencia: ${descripcionAgencia}

El seguimiento debe ser más breve que el original, diferente enfoque, recordatorio no insistente.

Responde SOLO con JSON: {"asunto": "...", "cuerpo": "..."}`
    }],
  })

  const texto = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(texto.trim())
}
