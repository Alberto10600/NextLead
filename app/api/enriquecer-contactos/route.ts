import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buscarContactosPorDominio } from '@/lib/hunter'
import { deduplicarContactos } from '@/lib/deduplicacion'
import { sleep } from '@/lib/utils'
import type { Contacto } from '@/types'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { dominios, cargos_objetivo, campana_id } = body

  if (!dominios || !campana_id) {
    return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 })
  }

  const contactosCrudos: Contacto[] = []
  const dominiosSinResultados: string[] = []

  for (const dominio of dominios) {
    await sleep(100)

    const resultados = await buscarContactosPorDominio(dominio, cargos_objetivo || [])

    if (resultados.length === 0) {
      dominiosSinResultados.push(dominio)
      continue
    }

    for (const r of resultados) {
      contactosCrudos.push({
        id: '',
        user_id: user.id,
        campana_id,
        nombre: r.nombre,
        apellido: r.apellido,
        cargo: r.cargo,
        email: r.email,
        empresa: r.empresa,
        dominio: r.dominio,
        linkedin_url: r.linkedin_url,
        estado: 'pendiente',
        numero_seguimiento: 0,
      })
    }
  }

  if (contactosCrudos.length === 0) {
    return NextResponse.json(
      { error: 'No se encontraron contactos. Prueba con un sector más amplio.' },
      { status: 404 }
    )
  }

  const { contactosFiltrados, duplicadosEliminados } = await deduplicarContactos(
    contactosCrudos,
    user.id,
    supabase
  )

  return NextResponse.json({
    contactos: contactosFiltrados,
    duplicados_eliminados: duplicadosEliminados,
    dominios_sin_resultados: dominiosSinResultados,
    total_encontrados: contactosCrudos.length,
  })
}
