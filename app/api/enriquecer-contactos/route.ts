import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buscarContactosPorDominio } from '@/lib/hunter'
import { sleep } from '@/lib/utils'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { dominios, cargos_objetivo } = body

  if (!dominios || dominios.length === 0) {
    return NextResponse.json({ error: 'No hay dominios' }, { status: 400 })
  }

  const contactos = []
  const dominiosSinResultados: string[] = []

  for (const dominio of dominios as string[]) {
    await sleep(200)

    try {
      const resultados = await buscarContactosPorDominio(dominio, cargos_objetivo || [])

      if (resultados.length === 0) {
        dominiosSinResultados.push(dominio)
      } else {
        for (const r of resultados) {
          contactos.push({
            nombre: r.nombre,
            apellido: r.apellido,
            cargo: r.cargo,
            email: r.email,
            empresa: r.empresa,
            dominio: r.dominio,
            linkedin_url: r.linkedin_url,
          })
        }
      }
    } catch (e) {
      console.error(`Error en dominio ${dominio}:`, e)
      dominiosSinResultados.push(dominio)
    }
  }

  // Eliminar emails duplicados
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
