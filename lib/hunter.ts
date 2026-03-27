import { sleep } from './utils'
import type { FiltrosHunter } from '@/types'

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

// ─── Domain Search: todos los emails de un dominio, sin filtros ──────────────

const PAGE_SIZE = 100

type HunterEmailRaw = {
  first_name?: string
  last_name?: string
  position?: string
  value: string
  linkedin?: string
}

async function fetchPagina(
  dominio: string,
  offset: number,
  limit = PAGE_SIZE,
): Promise<{ emails: HunterContacto[]; total: number }> {
  const key = API_KEY()
  if (!key) throw new Error('HUNTER_API_KEY no configurada en .env.local')

  const params = new URLSearchParams({
    domain:  dominio,
    api_key: key,
    limit:   String(limit),
    offset:  String(offset),
  })

  let intentos = 0
  while (intentos < 3) {
    const res = await fetch(`${HUNTER_BASE}/domain-search?${params.toString()}`)

    if (res.status === 429) {
      await sleep(2000 * (intentos + 1))
      intentos++
      continue
    }

    const text = await res.text()
    let data: { data?: { organization?: string; emails?: HunterEmailRaw[] }; meta?: { results?: number }; errors?: { id: string }[] }
    try { data = JSON.parse(text) } catch { return { emails: [], total: 0 } }

    // Plan gratuito: limit=100 rechazado con 400 pagination_error → reintentar con limit=10
    if (res.status === 400 && data.errors?.some(e => e.id === 'pagination_error')) {
      if (limit > 10) {
        console.log(`[Hunter] plan gratuito detectado, reintentando con limit=10`)
        return fetchPagina(dominio, offset, 10)
      }
      return { emails: [], total: 0 }
    }

    if (!res.ok) {
      console.error(`[Hunter] domain-search ${dominio} → ${res.status}: ${text.slice(0, 200)}`)
      return { emails: [], total: 0 }
    }

    const empresa: string = data.data?.organization || dominio
    const total: number = data.meta?.results ?? data.data?.emails?.length ?? 0
    const emails: HunterContacto[] = (data.data?.emails || []).map((p: HunterEmailRaw) => ({
      nombre:       p.first_name,
      apellido:     p.last_name,
      cargo:        p.position,
      email:        p.value,
      linkedin_url: p.linkedin,
      empresa,
      dominio,
    }))
    console.log(`[Hunter] ${dominio} offset=${offset} → ${emails.length} emails (total: ${total})`)
    return { emails, total }
  }
  return { emails: [], total: 0 }
}

/**
 * Devuelve TODOS los emails de un dominio paginando automáticamente.
 * Detecta el límite real del plan (10 en free, 100 en paid) y pagina con él.
 */
export async function buscarTodosLosContactos(dominio: string): Promise<HunterContacto[]> {
  const primera = await fetchPagina(dominio, 0)
  const todos = [...primera.emails]

  // El límite efectivo = cuántos trajo la primera página (10 en free, 100 en paid)
  // No usamos meta.results porque el plan free lo reporta como 10 aunque haya más
  const limite = primera.emails.length || PAGE_SIZE
  let offset = limite
  let ultimaPaginaLlena = primera.emails.length === limite

  while (ultimaPaginaLlena) {
    await sleep(300)
    const pagina = await fetchPagina(dominio, offset, limite)
    if (pagina.emails.length === 0) break
    todos.push(...pagina.emails)
    offset += limite
    ultimaPaginaLlena = pagina.emails.length === limite
  }

  console.log(`[Hunter] ${dominio} → ${todos.length} contactos`)
  return todos
}
