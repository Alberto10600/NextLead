import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buscarTodosLosContactos } from '@/lib/hunter'
import { sleep } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { dominios } = body as { dominios: string[] }

  if (!dominios?.length) {
    return NextResponse.json({ error: 'No hay dominios' }, { status: 400 })
  }

  const contactos = []
  const dominiosSinResultados: string[] = []

  for (const dominio of dominios) {
    await sleep(200)
    try {
      const resultados = await buscarTodosLosContactos(dominio)
      if (resultados.length === 0) {
        dominiosSinResultados.push(dominio)
      } else {
        contactos.push(...resultados)
      }
    } catch (e) {
      console.error(`Error en dominio ${dominio}:`, e)
      dominiosSinResultados.push(dominio)
    }
  }

  // Deduplicar por email
  const emailsVistos = new Set<string>()
  const contactosFiltrados = contactos.filter((c) => {
    if (emailsVistos.has(c.email)) return false
    emailsVistos.add(c.email)
    return true
  })

  return NextResponse.json({
    contactos: contactosFiltrados,
    total: contactosFiltrados.length,
    dominios_sin_resultados: dominiosSinResultados,
  })
}
