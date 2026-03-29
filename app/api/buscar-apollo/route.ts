import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buscarHastaObjetivo, paisIsoAApollo } from '@/lib/apollo'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const {
    titulos,       // string[] — títulos de cargo
    seniorities,   // string[] — c_suite | vp | director | manager...
    pais,          // ISO: "ES", "MX"...
    industrias,    // string[] — keywords de industria
    tamanos,       // string[] — "1,50", "51,200"...
    limite = 25,   // número de contactos objetivo
  } = body as {
    titulos: string[]
    seniorities: string[]
    pais?: string
    industrias?: string[]
    tamanos?: string[]
    limite?: number
  }

  if (!titulos?.length) {
    return NextResponse.json({ error: 'Faltan los títulos de cargo' }, { status: 400 })
  }

  // Deduplicar dominios ya buscados en campañas del usuario para no repetir
  const { data: dominiosYaBuscados } = await supabase
    .from('contactos')
    .select('dominio')
    .eq('user_id', user.id)
    .not('dominio', 'is', null)

  const dominiosExistentes = new Set(
    (dominiosYaBuscados || []).map((c) => c.dominio).filter(Boolean)
  )

  const paisApollo = pais ? paisIsoAApollo(pais) : undefined

  try {
    const contactos = await buscarHastaObjetivo({
      titulos,
      seniorities: seniorities || [],
      pais: paisApollo,
      industrias,
      tamanos,
      limite: Math.min(limite, 200),
    })

    // Estadísticas de deduplicación
    const nuevos = contactos.filter((c) => !c.dominio || !dominiosExistentes.has(c.dominio))
    const duplicados = contactos.length - nuevos.length

    return NextResponse.json({
      contactos: nuevos,
      total: contactos.length,
      duplicados,
      sin_email: contactos.filter((c) => !c.email).length,
    })
  } catch (e: unknown) {
    console.error('[buscar-apollo] error:', e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
