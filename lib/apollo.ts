// ─── Apollo.io API client ─────────────────────────────────────────────────────
// Documentación: https://apolloio.github.io/apollo-api-docs/

// Apollo base: try /api/v1 first (newer), /v1 is legacy
const APOLLO_BASE = 'https://api.apollo.io/v1'
const API_KEY = () => process.env.APOLLO_API_KEY!

export interface ApolloPersona {
  nombre?: string
  apellido?: string
  cargo?: string
  email?: string
  linkedin_url?: string
  empresa?: string
  dominio?: string
  ciudad?: string
  pais?: string
}

export interface ApolloBusquedaFiltros {
  titulos: string[]           // person_titles
  seniorities: string[]       // person_seniorities: owner|founder|c_suite|vp|head|director|manager|senior
  pais?: string               // "Spain", "Mexico", etc.
  industrias?: string[]       // industry keywords
  tamanos?: string[]          // org employee ranges: "1,10" | "11,50" | "51,200" | "201,500" | "501,1000"
  limite: number              // max contacts to return
}

// Mapeo de nuestros países ISO → nombres que entiende Apollo
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

export async function buscarPersonas(
  filtros: ApolloBusquedaFiltros,
  pagina = 1,
): Promise<{ contactos: ApolloPersona[]; total: number }> {
  const key = API_KEY()
  if (!key) throw new Error('APOLLO_API_KEY no configurada')

  const perPage = Math.min(filtros.limite, 100)

  const body: Record<string, unknown> = {
    per_page: perPage,
    page: pagina,
    // Solo contactos con email verificado o probable
    contact_email_status_v2: ['verified', 'likely to engage', 'guessed'],
  }

  if (filtros.titulos.length) body.person_titles = filtros.titulos
  if (filtros.seniorities.length) body.person_seniorities = filtros.seniorities
  if (filtros.pais) body.person_locations = [filtros.pais]
  if (filtros.industrias?.length) body.q_organization_keyword_tags = filtros.industrias
  if (filtros.tamanos?.length) body.organization_num_employees_ranges = filtros.tamanos

  console.log('[Apollo] POST /mixed_people/search', JSON.stringify(body))

  const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': key,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  console.log('[Apollo] status:', res.status, '| body:', text.slice(0, 500))

  if (!res.ok) {
    throw new Error(`Apollo error ${res.status}: ${text.slice(0, 200)}`)
  }

  let data: {
    people?: ApolloPersonaRaw[]
    contacts?: ApolloPersonaRaw[]
    pagination?: { total_entries?: number }
  }
  try { data = JSON.parse(text) } catch { return { contactos: [], total: 0 } }

  const personas = data.people || data.contacts || []
  const total = data.pagination?.total_entries ?? personas.length

  const contactos: ApolloPersona[] = personas.map((p) => ({
    nombre:      p.first_name || undefined,
    apellido:    p.last_name || undefined,
    cargo:       p.title || p.headline || undefined,
    email:       p.email || undefined,
    linkedin_url: p.linkedin_url || undefined,
    empresa:     p.organization?.name || p.employment_history?.[0]?.organization_name || undefined,
    dominio:     p.organization?.primary_domain || undefined,
    ciudad:      p.city || undefined,
    pais:        p.country || undefined,
  }))

  console.log(`[Apollo] página ${pagina} → ${contactos.length} personas (total: ${total})`)
  return { contactos, total }
}

// ─── Busca hasta N contactos paginando automáticamente ────────────────────────
export async function buscarHastaObjetivo(
  filtros: ApolloBusquedaFiltros,
): Promise<ApolloPersona[]> {
  const resultado: ApolloPersona[] = []
  let pagina = 1
  const maxPaginas = 5  // seguridad anti-loop

  while (resultado.length < filtros.limite && pagina <= maxPaginas) {
    const { contactos, total } = await buscarPersonas(filtros, pagina)
    if (contactos.length === 0) break

    // Filtrar los que no tienen email (no gastar créditos en vacíos)
    const conEmail = contactos.filter((c) => c.email)
    resultado.push(...conEmail)

    if (resultado.length >= filtros.limite) break
    if (resultado.length >= total) break  // no hay más páginas

    pagina++
  }

  return resultado.slice(0, filtros.limite)
}

// ─── Tipos internos ───────────────────────────────────────────────────────────
interface ApolloPersonaRaw {
  first_name?: string
  last_name?: string
  title?: string
  headline?: string
  email?: string
  linkedin_url?: string
  city?: string
  country?: string
  organization?: {
    name?: string
    primary_domain?: string
  }
  employment_history?: Array<{ organization_name?: string }>
}
