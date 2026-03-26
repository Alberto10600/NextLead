import { truncate } from './utils'

export async function scrapearWeb(dominio: string): Promise<string | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const res = await fetch(`https://${dominio}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NextLeadBot/1.0)',
      },
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const html = await res.text()

    // Extraer texto visible eliminando scripts, estilos y HTML
    const sinScripts = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    const sinEstilos = sinScripts.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    const sinHtml = sinEstilos.replace(/<[^>]+>/g, ' ')
    const texto = sinHtml.replace(/\s+/g, ' ').trim()

    return truncate(texto, 500)
  } catch {
    clearTimeout(timeout)
    return null
  }
}
