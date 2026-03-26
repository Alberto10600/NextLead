export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function extraerDominio(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^www\./, '').split('/')[0]
  }
}

export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(fecha))
}

export function calcularTasaApertura(enviados: number, abiertos: number): string {
  if (enviados === 0) return '0%'
  return `${Math.round((abiertos / enviados) * 100)}%`
}

export function añadirDias(fecha: Date, dias: number): Date {
  const result = new Date(fecha)
  result.setDate(result.getDate() + dias)
  return result
}
