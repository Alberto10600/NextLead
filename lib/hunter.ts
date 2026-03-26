import { sleep } from './utils'

export interface HunterContacto {
  nombre?: string
  apellido?: string
  cargo?: string
  email: string
  linkedin_url?: string
  empresa?: string
  dominio: string
}

interface HunterPerson {
  first_name?: string
  last_name?: string
  position?: string
  email: string
  linkedin?: string
}

interface HunterResponse {
  data?: {
    emails?: HunterPerson[]
    organization?: string
  }
  errors?: { details: string }[]
}

export async function buscarContactosPorDominio(
  dominio: string,
  cargosObjetivo: string[],
  limite = 3
): Promise<HunterContacto[]> {
  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(dominio)}&api_key=${process.env.HUNTER_API_KEY}&limit=${limite}`

  const intentar = async (): Promise<HunterContacto[]> => {
    const res = await fetch(url)

    if (res.status === 429) {
      throw { status: 429 }
    }

    if (!res.ok) return []

    const data: HunterResponse = await res.json()

    if (!data.data?.emails || data.data.emails.length === 0) return []

    const empresa = data.data.organization || dominio
    let contactos: HunterContacto[] = data.data.emails.map((p) => ({
      nombre: p.first_name,
      apellido: p.last_name,
      cargo: p.position,
      email: p.email,
      linkedin_url: p.linkedin,
      empresa,
      dominio,
    }))

    // Filtrar por cargos objetivo si hay resultados suficientes
    if (cargosObjetivo.length > 0) {
      const filtrados = contactos.filter((c) =>
        c.cargo && cargosObjetivo.some((cargo) =>
          c.cargo!.toLowerCase().includes(cargo.toLowerCase())
        )
      )
      if (filtrados.length > 0) contactos = filtrados
    }

    // Máximo 2 contactos por dominio
    return contactos.slice(0, 2)
  }

  try {
    return await intentar()
  } catch (e: unknown) {
    const error = e as { status?: number }
    if (error?.status === 429) {
      await sleep(2000)
      return await intentar()
    }
    return []
  }
}
