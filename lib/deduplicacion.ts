import type { SupabaseClient } from '@supabase/supabase-js'
import type { Contacto } from '@/types'

interface ResultadoDedup {
  contactosFiltrados: Contacto[]
  duplicadosEliminados: number
  motivos: string[]
}

export async function deduplicarContactos(
  contactos: Contacto[],
  userId: string,
  supabase: SupabaseClient
): Promise<ResultadoDedup> {
  const motivos: string[] = []
  let duplicadosEliminados = 0

  // 1. Dedup por email dentro del array
  const emailsVistos = new Set<string>()
  let filtrados = contactos.filter((c) => {
    if (emailsVistos.has(c.email)) {
      duplicadosEliminados++
      motivos.push(`Email duplicado en resultados: ${c.email}`)
      return false
    }
    emailsVistos.add(c.email)
    return true
  })

  // 2. Dedup por dominio dentro del array (1 por empresa)
  const dominiosVistos = new Set<string>()
  filtrados = filtrados.filter((c) => {
    const dominio = c.dominio || ''
    if (dominio && dominiosVistos.has(dominio)) {
      duplicadosEliminados++
      motivos.push(`Dominio duplicado en resultados: ${dominio}`)
      return false
    }
    if (dominio) dominiosVistos.add(dominio)
    return true
  })

  if (filtrados.length === 0) return { contactosFiltrados: [], duplicadosEliminados, motivos }

  const emails = filtrados.map((c) => c.email)
  const dominios = filtrados.map((c) => c.dominio).filter(Boolean) as string[]

  // 3. Emails ya contactados por el usuario en BD
  const { data: emailsHistorial } = await supabase
    .from('historial_contactos')
    .select('email')
    .eq('user_id', userId)
    .in('email', emails)

  const emailsBloqueados = new Set((emailsHistorial || []).map((h: { email: string }) => h.email))

  // 4. Dominios contactados en últimos 30 días
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  const { data: dominiosHistorial } = await supabase
    .from('historial_contactos')
    .select('dominio')
    .eq('user_id', userId)
    .in('dominio', dominios)
    .gte('fecha_ultimo_contacto', hace30Dias.toISOString())

  const dominiosBloqueados = new Set((dominiosHistorial || []).map((h: { dominio: string }) => h.dominio))

  filtrados = filtrados.filter((c) => {
    if (emailsBloqueados.has(c.email)) {
      duplicadosEliminados++
      motivos.push(`Email ya contactado previamente: ${c.email}`)
      return false
    }
    if (c.dominio && dominiosBloqueados.has(c.dominio)) {
      duplicadosEliminados++
      motivos.push(`Dominio contactado en últimos 30 días: ${c.dominio}`)
      return false
    }
    return true
  })

  return { contactosFiltrados: filtrados, duplicadosEliminados, motivos }
}
