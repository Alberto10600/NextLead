import { sleep } from './utils'
import type { FiltrosHunter, HunterDepartamento, HunterSeniority } from '@/types'

const HUNTER_BASE = 'https://api.hunter.io/v2'
const API_KEY = () => process.env.HUNTER_API_KEY!

export interface HunterContacto {
  nombre?: string
  apellido?: string
  cargo?: string
  email: string
  linkedin_url?: string
  empresa?: string
  dominio: string
}

// ─── Discover: busca empresas por sector/país/tamaño ─────────────────────────

interface DiscoverEmpresa {
  name: string
  domain: string
  headcount?: string
  industry?: string
  country?: string
}

export async function descubrirEmpresas(
  filtros: FiltrosHunter,
  limite = 20
): Promise<DiscoverEmpresa[]> {
  const params = new URLSearchParams({ api_key: API_KEY(), limit: String(limite) })

  if (filtros.sector) {
    params.set('industry', JSON.stringify({ include: [filtros.sector] }))
  }
  if (filtros.pais) {
    params.set('headquarters_location', JSON.stringify({ include: [{ country: filtros.pais }] }))
  }
  if (filtros.tamanos?.length) {
    params.set('headcount', JSON.stringify(filtros.tamanos))
  }

  const url = `${HUNTER_BASE}/discover?${params.toString()}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`Hunter Discover error ${res.status}:`, await res.text())
      return []
    }
    const data = await res.json()
    return (data.data?.companies || []) as DiscoverEmpresa[]
  } catch (e) {
    console.error('Hunter Discover exception:', e)
    return []
  }
}

// ─── Domain Search: busca emails en un dominio con filtros ────────────────────

export async function buscarContactosPorDominio(
  dominio: string,
  cargosObjetivo: string[] = [],
  departamentos: HunterDepartamento[] = [],
  seniority: HunterSeniority[] = [],
  limite = 5
): Promise<HunterContacto[]> {
  const intentar = async (): Promise<HunterContacto[]> => {
    const params = new URLSearchParams({
      domain:  dominio,
      api_key: API_KEY(),
      limit:   String(limite),
    })

    // Pasar el primer departamento/seniority si hay seleccionados
    // (Hunter acepta uno por llamada; para múltiples hacemos varias llamadas)
    if (departamentos.length === 1) params.set('department', departamentos[0])
    if (seniority.length === 1)     params.set('seniority', seniority[0])

    const res = await fetch(`${HUNTER_BASE}/domain-search?${params.toString()}`)

    if (res.status === 429) throw { status: 429 }
    if (!res.ok) return []

    const data = await res.json()
    if (!data.data?.emails?.length) return []

    const empresa = data.data.organization || dominio

    let contactos: HunterContacto[] = data.data.emails.map((p: {
      first_name?: string
      last_name?: string
      position?: string
      value: string
      linkedin?: string
    }) => ({
      nombre:       p.first_name,
      apellido:     p.last_name,
      cargo:        p.position,
      email:        p.value,
      linkedin_url: p.linkedin,
      empresa,
      dominio,
    }))

    // Filtrar por cargos si se especificaron (además del filtro de Hunter)
    if (cargosObjetivo.length > 0) {
      const filtrados = contactos.filter((c) =>
        c.cargo && cargosObjetivo.some((cargo) =>
          c.cargo!.toLowerCase().includes(cargo.toLowerCase())
        )
      )
      if (filtrados.length > 0) contactos = filtrados
    }

    return contactos.slice(0, 3)
  }

  try {
    return await intentar()
  } catch (e: unknown) {
    const err = e as { status?: number }
    if (err?.status === 429) {
      await sleep(2000)
      return await intentar()
    }
    return []
  }
}

// ─── Múltiples departamentos: una llamada por cada uno ───────────────────────

export async function buscarContactosMultiDept(
  dominio: string,
  departamentos: HunterDepartamento[],
  seniority: HunterSeniority[],
): Promise<HunterContacto[]> {
  if (departamentos.length <= 1 && seniority.length <= 1) {
    return buscarContactosPorDominio(dominio, [], departamentos, seniority)
  }

  // Si hay múltiples departamentos, hacemos una llamada por cada uno
  const depts = departamentos.length > 0 ? departamentos : [undefined]
  const todos: HunterContacto[] = []
  const emailsVistos = new Set<string>()

  for (const dept of depts) {
    await sleep(150)
    const resultados = await buscarContactosPorDominio(
      dominio, [],
      dept ? [dept] : [],
      seniority.slice(0, 1),
      3
    )
    for (const c of resultados) {
      if (!emailsVistos.has(c.email)) {
        emailsVistos.add(c.email)
        todos.push(c)
      }
    }
    if (todos.length >= 5) break // max 5 por dominio
  }

  return todos
}
