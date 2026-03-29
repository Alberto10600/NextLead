import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sleep } from './utils'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurada')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

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

export async function generarDominiosPorSector(sector: string, pais: string, cantidad: number = 15, region?: string): Promise<string[]> {
  const ubicacion = region ? `${region}, ${pais}` : pais
  const prompt = `Lista exactamente ${cantidad} dominios web REALES de empresas del sector "${sector}" en ${ubicacion}.
Deben ser empresas reales, activas, con web funcional, de distintos tamaños (desde PYME a grande).${region ? `\nPrioriza empresas con sede o presencia destacada en ${region}.` : ''}
Solo el dominio raíz (ej: empresa.es, empresa.com). Sin www, sin https.

Responde SOLO con este JSON:
{"dominios": ["empresa1.es", "empresa2.com", ...]}`

  for (let intento = 0; intento < 3; intento++) {
    try {
      const message = await getAnthropic().messages.create({
        model: process.env.EMAIL_GENERATION_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: 'Eres un experto en el mercado empresarial español y latinoamericano. Solo devuelves JSON estricto sin markdown.',
        messages: [{ role: 'user', content: prompt }],
      })
      const texto = message.content[0].type === 'text' ? message.content[0].text : ''
      const limpio = extraerJSON(texto)
      const parsed = JSON.parse(limpio)
      if (!Array.isArray(parsed.dominios)) throw new Error('Formato inválido')
      return parsed.dominios.map((d: string) => d.replace(/^www\./, '').toLowerCase())
    } catch (e: unknown) {
      if (intento === 2) throw new Error(`Error generando dominios: ${(e as Error).message}`)
      await sleep(1500)
    }
  }
  throw new Error('No se pudieron generar dominios')
}

export async function analizarEmpresa(dominio: string, contextoWeb: string): Promise<string> {
  const message = await getAnthropic().messages.create({
    model: process.env.EMAIL_GENERATION_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: 'Eres un analista de empresas B2B. Respondes en español, de forma concisa y útil para un comercial.',
    messages: [{
      role: 'user',
      content: `Analiza esta empresa (dominio: ${dominio}) a partir de su web:

${contextoWeb}

Devuelve un análisis breve (máximo 100 palabras) con:
1. Qué hace la empresa (1 frase)
2. Tamaño aproximado (PYME/mediana/grande)
3. Punto de dolor probable para un comercial que vende servicios de marketing

Responde SOLO con JSON: {"actividad": "...", "tamano": "...", "dolor": "...", "resumen": "..."}`
    }],
  })
  const texto = message.content[0].type === 'text' ? message.content[0].text : ''
  return extraerJSON(texto)
}

const INSTRUCCIONES_TONO: Record<string, string> = {
  cercano:    'Tono cercano y directo. Tratamiento de tú. Natural, sin formalismos.',
  formal:     'Tono profesional y formal. Tratamiento de usted. Respetuoso y corporativo.',
  millennial: 'Tono muy cercano, informal y moderno. Sin formalismos, como un mensaje entre colegas.',
  tecnico:    'Tono técnico y preciso. Usa datos, métricas y terminología del sector. Directo al grano.',
}

export async function generarEmailProspeccion(params: {
  nombre?: string
  apellido?: string
  cargo?: string
  empresa?: string
  sector: string
  contextoWeb?: string
  analisisEmpresa?: { actividad?: string; tamano?: string; dolor?: string; resumen?: string }
  descripcionAgencia: string
  tono?: string
}): Promise<{ asunto: string; cuerpo: string }> {
  const { nombre, apellido, cargo, empresa, sector, contextoWeb, analisisEmpresa, descripcionAgencia, tono = 'cercano' } = params

  const skill = leerSkillEmail()

  const tonoInstruccion = INSTRUCCIONES_TONO[tono] || INSTRUCCIONES_TONO.cercano

  // Build a rich context block from structured analysis + raw web
  const bloqueContexto = [
    analisisEmpresa?.resumen && `- Resumen empresa: ${analisisEmpresa.resumen}`,
    analisisEmpresa?.actividad && `- Actividad: ${analisisEmpresa.actividad}`,
    analisisEmpresa?.tamano && `- Tamaño: ${analisisEmpresa.tamano}`,
    analisisEmpresa?.dolor && `- Punto de dolor identificado: ${analisisEmpresa.dolor}`,
    !analisisEmpresa && contextoWeb && `- Contexto web: ${contextoWeb.slice(0, 600)}`,
  ].filter(Boolean).join('\n')

  const userPrompt = skill
    ? skill
        .replace('{{nombre}}', nombre || 'el/la responsable')
        .replace('{{apellido}}', apellido || '')
        .replace('{{cargo}}', cargo || 'responsable de la empresa')
        .replace('{{empresa}}', empresa || 'la empresa')
        .replace('{{sector}}', sector)
        .replace('{{contexto_web}}', bloqueContexto)
        .replace('{{descripcion_agencia}}', descripcionAgencia)
        .replace('{{tono}}', tonoInstruccion)
    : `Eres un experto en ventas B2B con 15 años de experiencia. Escribe un email de prospección en frío de alto rendimiento para:

DESTINATARIO:
- Nombre: ${nombre || 'el/la responsable'} ${apellido || ''}
- Cargo: ${cargo || 'responsable'}
- Empresa: ${empresa || 'la empresa'} (sector: ${sector})
${bloqueContexto ? `\nCONTEXTO DE LA EMPRESA:\n${bloqueContexto}` : ''}

MI PROPUESTA:
${descripcionAgencia}

TONO: ${tonoInstruccion}

ESTRUCTURA OBLIGATORIA DEL CUERPO (en este orden):
1. Apertura con gancho específico (1 frase) — algo concreto de SU empresa o sector que demuestre que no es un email masivo
2. Problema real que tienen (1 frase) — basado en el punto de dolor identificado, específico del sector
3. Qué hago yo y UN resultado concreto o caso de éxito (1-2 frases) — cuantificado si es posible
4. Cierre con UNA pregunta de respuesta fácil (1 frase) — que invite a una conversación corta, no a comprar

REGLAS CRÍTICAS:
- Asunto: 5-7 palabras, intrigante, sin emojis, no genérico
- Cuerpo: MÁXIMO 90 palabras. Cada palabra debe aportar valor
- El gancho inicial debe referenciar algo real y específico de la empresa/sector — nunca abrir con "te escribo porque"
- El problema debe ser CONCRETO y RECONOCIBLE por el destinatario, no vago
- El resultado debe ser específico: porcentajes, plazos, nombres de sector, no "mejorar resultados"
- La pregunta final: corta, concreta, que se responda con sí/no o en 10 segundos
- PROHIBIDO: 'espero', 'estimado/a', 'me pongo en contacto', 'solución integral', 'innovador', 'sinergias', 'adjunto', 'no dude en', 'a su disposición', 'potenciar', 'optimizar'
- PROHIBIDO empezar por el nombre del destinatario en el asunto

Responde SOLO con este JSON (sin markdown):
{"asunto": "...", "cuerpo": "..."}`

  const intentar = async (): Promise<{ asunto: string; cuerpo: string }> => {
    const message = await getAnthropic().messages.create({
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

  const estrategias: Record<number, string> = {
    1: `SEGUIMIENTO #1 — Tono: casual, sin presión.
Objetivo: comprobar que recibió el primer email. Muy breve (3-4 líneas máx).
Enfoque: "Solo quería asegurarme de que te llegó. Si no es el momento, dímelo y no te molesto más."
NO repitas la propuesta de valor del email anterior. NO vendas nada. Solo verificar recepción.`,

    2: `SEGUIMIENTO #2 — Tono: propositivo, ángulo nuevo.
Objetivo: presentar un ángulo o caso de uso que NO aparece en el email anterior.
Enfoque: ejemplo concreto de resultado conseguido con otro cliente del mismo sector, o un punto de dolor diferente.
Añade una pregunta directa al final que se responda en 10 segundos.`,

    3: `SEGUIMIENTO #3 — Tono: definitivo, respetuoso.
Objetivo: cierre de la secuencia. Si no hay respuesta, se respeta y se cierra.
Enfoque: "Entiendo que quizás no es el momento o no encaja. Es mi último mensaje. Si en algún momento cambia algo, aquí me tienes."
Muy breve. Sin presión. Deja la puerta abierta de forma elegante.`,
  }

  const estrategia = estrategias[numeroSeguimiento] || `SEGUIMIENTO #${numeroSeguimiento} — Tono: breve y directo. Ángulo diferente al email anterior. Máximo 4 líneas.`

  const message = await getAnthropic().messages.create({
    model: process.env.EMAIL_GENERATION_MODEL || 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    system: 'Eres un experto en ventas B2B en España. Escribes follow-ups que consiguen respuesta porque son honestos y no insistentes. Responde en JSON estricto sin markdown.',
    messages: [{
      role: 'user',
      content: `Contacto: ${nombre || 'el contacto'} · Empresa: ${empresa || 'la empresa'}
Mi agencia: ${descripcionAgencia}

Email original que ya se envió:
${emailAnterior}

---
${estrategia}

REGLAS:
- Asunto: diferente al del email original, máx 8 palabras
- Cuerpo: máx 80 palabras
- PROHIBIDO repetir el asunto o el gancho del email original
- PROHIBIDO: 'espero', 'estimado', 'me pongo en contacto', 'solución integral', 'innovador'
- Escribe en primera persona, tono humano y directo

Responde SOLO con JSON: {"asunto": "...", "cuerpo": "..."}`
    }],
  })

  const texto = message.content[0].type === 'text' ? message.content[0].text : ''
  const limpio = extraerJSON(texto)
  return JSON.parse(limpio)
}
