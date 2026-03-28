import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY no configurada')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { descripcion } = await req.json()
  if (!descripcion?.trim()) return NextResponse.json({ error: 'Descripción requerida' }, { status: 400 })

  const prompt = `Eres un experto en ventas B2B. Una empresa ofrece el siguiente servicio:

"${descripcion.trim()}"

Devuelve un array JSON con 6-8 cargos/roles específicos que serían los mejores destinatarios para una campaña de outbound de este servicio.

Reglas:
- Cargos concretos y buscables (ej: "CEO", "Director de Marketing", "CMO", no genéricos)
- Mezcla de perfiles: decision makers + influenciadores
- En español (o el idioma del servicio)
- Solo el array JSON, sin texto adicional

Ejemplo de formato: ["CEO","Director de Marketing","CMO","Head of Growth","Director Comercial","VP Marketing"]`

  try {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const texto = (msg.content[0] as { text: string }).text.trim()

    // Parse JSON array
    const match = texto.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ perfiles: [] })

    const perfiles: string[] = JSON.parse(match[0])
    return NextResponse.json({ perfiles: perfiles.slice(0, 8) })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
