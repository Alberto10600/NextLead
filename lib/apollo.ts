// ─── Apollo.io API client ─────────────────────────────────────────────────────
// Docs: https://docs.apollo.io
//
// FLUJO DE DOS PASOS (optimizado para créditos):
//   1. Search → gratis, devuelve IDs + has_email boolean (sin emails reales)
//   2. Bulk enrich → 1 crédito por email encontrado, devuelve datos completos
//
// Así solo gastamos créditos en contactos que realmente tienen email.

const APOLLO_BASE = 'https://api.apollo.io/api/v1'
const API_KEY = () => process.env.APOLLO_API_KEY!

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface ApolloPersona {
  id: string
  nombre?: string
  apellido?: string
  cargo?: string
  email?: string
  linkedin_url?: string
  empresa?: string
  dominio?: string
  ciudad?: string
  pais?: string
  tiene_email: boolean   // indicador de la búsqueda (sin coste)
}

export interface ApolloBusquedaFiltros {
  titulos: string[]       // person_titles
  seniorities: string[]   // c_suite | founder | owner | vp | head | director | manager | senior | entry
  pais?: string           // "Spain", "Mexico", etc.
  industrias?: string[]   // q_organization_keyword_tags: ["saas", "retail", ...]
  tamanos?: string[]      // org employee ranges: "1,200" | "201,500" | "501,1000"
  limite: number          // número de contactos con email que queremos al final
}

// ─── Mapeo países ISO → nombre Apollo ────────────────────────────────────────

const PAIS_ISO_A_APOLLO: Record<string, string> = {
  ES: 'Spain', MX: 'Mexico', AR: 'Argentina', CO: 'Colombia',
  CL: 'Chile', PE: 'Peru', US: 'United States', GB: 'United Kingdom',
  FR: 'France', DE: 'Germany', IT: 'Italy', PT: 'Portugal',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland',
  PL: 'Poland', BR: 'Brazil',
}

export function paisIsoAApollo(iso: string): string {
  return PAIS_ISO_A_APOLLO[iso] || iso
}

// ─── Paso 1: Búsqueda (gratis, sin emails) ───────────────────────────────────

interface PersonaRawSearch {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  title?: string
  linkedin_url?: string
  city?: string
  country?: string
  has_email?: boolean
  organization?: { name?: string; primary_domain?: string }
  organization_name?: string
}

async function buscarPersonas(
  filtros: ApolloBusquedaFiltros,
  pagina: number,
  perPage: number,
): Promise<{ personas: PersonaRawSearch[]; total: number }> {
  const key = API_KEY()
  if (!key) throw new Error('APOLLO_API_KEY no configurada')

  const body: Record<string, unknown> = {
    per_page: perPage,
    page: pagina,
  }

  if (filtros.titulos.length) body.person_titles = filtros.titulos
  if (filtros.seniorities.length) body.person_seniorities = filtros.seniorities
  if (filtros.pais) body.person_locations = [filtros.pais]
  if (filtros.industrias?.length) body.q_organization_keyword_tags = filtros.industrias
  if (filtros.tamanos?.length) body.organization_num_employees_ranges = filtros.tamanos

  console.log('[Apollo] Search page', pagina, JSON.stringify(body))

  const res = await fetch(`${APOLLO_BASE}/people/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'accept': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  console.log('[Apollo] Search status:', res.status, text.slice(0, 300))

  if (res.status === 429) throw new Error('Límite de peticiones Apollo alcanzado. Espera un momento.')
  if (!res.ok) throw new Error(`Apollo error ${res.status}: ${text.slice(0, 200)}`)

  let data: { people?: PersonaRawSearch[]; pagination?: { total_entries?: number } }
  try { data = JSON.parse(text) } catch { return { personas: [], total: 0 } }

  return {
    personas: data.people || [],
    total: data.pagination?.total_entries ?? 0,
  }
}

// ─── Paso 2: Enriquecimiento por IDs (1 crédito/email encontrado) ─────────────

interface PersonaRawEnrich {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  title?: string
  email?: string
  email_status?: string
  linkedin_url?: string
  city?: string
  country?: string
  organization?: {
    name?: string
    primary_domain?: string
    website_url?: string
  }
}

const ENRICH_BATCH = 10  // Apollo bulk_match max por llamada

async function enriquecerPorIds(ids: string[]): Promise<PersonaRawEnrich[]> {
  const key = API_KEY()
  if (!key) throw new Error('APOLLO_API_KEY no configurada')

  const results: PersonaRawEnrich[] = []

  // Procesar en batches de 10
  for (let i = 0; i < ids.length; i += ENRICH_BATCH) {
    const batch = ids.slice(i, i + ENRICH_BATCH)

    const res = await fetch(`${APOLLO_BASE}/people/bulk_match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'accept': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({
        details: batch.map(id => ({ id })),
        reveal_personal_emails: false,
        reveal_phone_number: false,
      }),
    })

    const text = await res.text()
    console.log('[Apollo] Enrich batch', i / ENRICH_BATCH + 1, 'status:', res.status)

    if (res.status === 429) throw new Error('Límite de créditos Apollo alcanzado.')
    if (!res.ok) {
      console.error('[Apollo] Enrich error:', text.slice(0, 200))
      continue  // saltar batch fallido, no abortar todo
    }

    let data: { matches?: PersonaRawEnrich[] }
    try { data = JSON.parse(text) } catch { continue }
    results.push(...(data.matches || []))
  }

  return results
}

// ─── API pública: buscar hasta N contactos con email ─────────────────────────

export async function buscarHastaObjetivo(
  filtros: ApolloBusquedaFiltros,
): Promise<ApolloPersona[]> {
  const resultado: ApolloPersona[] = []
  let pagina = 1
  const perPage = 100     // máximo por página en búsqueda (gratis)
  const maxPaginas = 5    // límite de seguridad

  while (resultado.length < filtros.limite && pagina <= maxPaginas) {
    // Paso 1: buscar (gratis)
    const { personas, total } = await buscarPersonas(filtros, pagina, perPage)
    if (personas.length === 0) break

    // Filtrar los que tienen email según Apollo
    const conEmail = personas.filter(p => p.has_email !== false)
    const idsParaEnriquecer = conEmail
      .map(p => p.id)
      .filter(Boolean)
      .slice(0, filtros.limite - resultado.length)  // solo los que necesitamos

    if (idsParaEnriquecer.length === 0) {
      if (resultado.length >= total) break
      pagina++
      continue
    }

    // Paso 2: enriquecer para obtener emails reales (1 crédito/email)
    const enriquecidos = await enriquecerPorIds(idsParaEnriquecer)

    for (const p of enriquecidos) {
      if (!p.email) continue  // sin email → no gastar más créditos en él
      resultado.push({
        id: p.id,
        nombre: p.first_name || undefined,
        apellido: p.last_name || undefined,
        cargo: p.title || undefined,
        email: p.email,
        linkedin_url: p.linkedin_url || undefined,
        empresa: p.organization?.name || undefined,
        dominio: p.organization?.primary_domain || p.organization?.website_url?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || undefined,
        ciudad: p.city || undefined,
        pais: p.country || undefined,
        tiene_email: true,
      })

      if (resultado.length >= filtros.limite) break
    }

    if (resultado.length >= filtros.limite) break
    if (personas.length < perPage) break  // no hay más páginas
    if ((pagina * perPage) >= total) break

    pagina++
  }

  console.log(`[Apollo] Resultado final: ${resultado.length} contactos con email`)
  return resultado
}
