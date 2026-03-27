import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sleep } from './utils'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

/** Extrae JSON limpio de una respuesta que puede venir con ```json...``` */
function extraerJSON(texto: string): string {
  const match = texto.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return match[1].trim()
  // Buscar el primer { hasta el último }
  const inicio = texto.indexOf('{')
  const fin = texto.lastIndexOf('}')
  if (inicio !== -1 && fin !== -1) return texto.slice(inicio, fin + 1)
  return texto.trim()
}

/** Lee el prompt de skills si existe, sino usa el default */
function leerSkillEmail(): string | null {
  try {
    return readFileSync(join(process.cwd(), 'prompts', 'email-prospeccion.md'), 'utf-8')
  } catch {
    return null
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

  const skill = leerSkillEmail()
  const contextoLinea = contextoWeb ? `- Web de su empresa: ${contextoWeb}` : ''

  const userPrompt = skill
    ? skill
        .replace('{{nombre}}', nombre || 'el/la responsable')
        .replace('{{apellido}}', apellido || '')
        .replace('{{cargo}}', cargo || 'responsable de la empresa')
        .replace('{{empresa}}', empresa || 'la empresa')
        .replace('{{sector}}', sector)
        .replace('{{contexto_web}}', contextoLinea)
        .replace('{{descripcion_agencia}}', descripcionAgencia)
    : `Redacta email de prospección B2B en español para:
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
      model: process.env.EMAIL_GENERATION_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      system: 'Eres un experto en ventas B2B y copywriting en España. Redactas emails de prospección que consiguen respuesta. Siempre respondes en JSON estricto sin markdown.',
      messages: [{ role: 'user', content: userPrompt }],
    })

    const texto = message.content[0].type === 'text' ? message.content[0].text : ''
    const limpio = extraerJSON(texto)
    const parsed = JSON.parse(limpio)
    if (!parsed.asunto || !parsed.cuerpo) throw new Error('Formato inválido')
    return parsed
  }

  // Hasta 3 reintentos con backoff
  for (let intento = 0; intento < 3; intento++) {
    try {
      return await intentar()
    } catch (e: unknown) {
      const error = e as { status?: number; message?: string }
      if (intento === 2) throw new Error(`Fallo tras 3 intentos: ${error.message || 'desconocido'}`)
      const espera = error?.status === 429 ? 5000 : 1500
      await sleep(espera)
    }
  }
  throw new Error('No se pudo generar el email')
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
  const limpio = extraerJSON(texto)
  return JSON.parse(limpio)
}
