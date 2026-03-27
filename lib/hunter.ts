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

export interface DiscoverEmpresa {
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
  const key = API_KEY()
  if (!key) throw new Error('HUNTER_API_KEY no configurada en .env.local')

  const params = new URLSearchParams({ api_key: key, limit: String(limite) })

  if (filtros.sector) {
    params.set('industry', filtros.sector)
  }
  if (filtros.pais) {
    params.set('country', filtros.pais)
  }
  if (filtros.tamanos?.length) {
    // Hunter acepta headcount como valores separados: headcount[]=11-50&headcount[]=51-200
    filtros.tamanos.forEach((t) => params.append('headcount[]', t))
  }

  const url = `${HUNTER_BASE}/companies?${params.toString()}`
  console.log('[Hunter] GET', url.replace(key, '***'))

  const res = await fetch(url)
  const text = await res.text()
  console.log('[Hunter] status:', res.status, '| body:', text.slice(0, 500))

  if (!res.ok) {
    throw new Error(`Hunter error ${res.status}: ${text}`)
  }

  let data: { data?: { companies?: DiscoverEmpresa[] } }
  try { data = JSON.parse(text) } catch { return [] }

  return (data.data?.companies || []) as DiscoverEmpresa[]
}

// ─── Domain Search: busca emails en un dominio con filtros y paginación ──────

const HUNTER_PAGE_SIZE = 100 // máximo permitido por Hunter

type HunterEmailRaw = {
  first_name?: string
  last_name?: string
  position?: string
  value: string
  linkedin?: string
}

async function fetchPagina(
  dominio: string,
  dept: HunterDepartamento | undefined,
  sen: HunterSeniority | undefined,
  offset: number,
): Promise<{ emails: HunterContacto[]; total: number; empresa: string }> {
  const key = API_KEY()
  const params = new URLSearchParams({
    domain:  dominio,
    api_key: key,
    limit:   String(HUNTER_PAGE_SIZE),
    offset:  String(offset),
  })
  if (dept) params.set('department', dept)
  if (sen)  params.set('seniority', sen)

  let intentos = 0
  while (intentos < 3) {
    const res = await fetch(`${HUNTER_BASE}/domain-search?${params.toString()}`)
    if (res.status === 429) {
      await sleep(2000 * (intentos + 1))
      intentos++
      continue
    }
    if (!res.ok) return { emails: [], total: 0, empresa: dominio }

    const data = await res.json()
    const empresa: string = data.data?.organization || dominio
    const total: number = data.meta?.results || data.data?.emails?.length || 0
    const emails: HunterContacto[] = (data.data?.emails || []).map((p: HunterEmailRaw) => ({
      nombre:       p.first_name,
      apellido:     p.last_name,
      cargo:        p.position,
      email:        p.value,
      linkedin_url: p.linkedin,
      empresa,
      dominio,
    }))
    return { emails, total, empresa }
  }
  return { emails: [], total: 0, empresa: dominio }
}

/**
 * Obtiene TODOS los emails de un dominio para una combinación dept+seniority,
 * paginando automáticamente hasta agotar los resultados.
 */
async function fetchTodosLosEmails(
  dominio: string,
  dept: HunterDepartamento | undefined,
  sen: HunterSeniority | undefined,
): Promise<HunterContacto[]> {
  const primera = await fetchPagina(dominio, dept, sen, 0)
  const todos = [...primera.emails]
  let offset = HUNTER_PAGE_SIZE

  while (offset < primera.total) {
    await sleep(150)
    const pagina = await fetchPagina(dominio, dept, sen, offset)
    todos.push(...pagina.emails)
    offset += HUNTER_PAGE_SIZE
    if (pagina.emails.length === 0) break
  }

  return todos
}

/**
 * Busca contactos en un dominio aplicando filtros de departamento y seniority.
 * Itera todas las combinaciones dept × seniority y deduplica por email.
 */
export async function buscarContactosMultiDept(
  dominio: string,
  departamentos: HunterDepartamento[],
  seniority: HunterSeniority[],
): Promise<HunterContacto[]> {
  const emailsVistos = new Set<string>()
  const todos: HunterContacto[] = []

  // Combinaciones: si no hay filtros, una sola llamada sin filtro
  const depts: (HunterDepartamento | undefined)[] = departamentos.length > 0 ? departamentos : [undefined]
  const seniors: (HunterSeniority | undefined)[] = seniority.length > 0 ? seniority : [undefined]

  for (const dept of depts) {
    for (const sen of seniors) {
      await sleep(150)
      const resultados = await fetchTodosLosEmails(dominio, dept, sen)
      for (const c of resultados) {
        if (!emailsVistos.has(c.email)) {
          emailsVistos.add(c.email)
          todos.push(c)
        }
      }
    }
  }

  return todos
}

// Alias para compatibilidad con código existente
export async function buscarContactosPorDominio(
  dominio: string,
  _cargosObjetivo: string[] = [],
  departamentos: HunterDepartamento[] = [],
  seniority: HunterSeniority[] = [],
): Promise<HunterContacto[]> {
  return buscarContactosMultiDept(dominio, departamentos, seniority)
}
