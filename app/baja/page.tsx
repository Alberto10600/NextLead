import Link from 'next/link'

export const metadata = {
  title: 'Baja de comunicaciones — Arrivo',
}

export default function BajaPage({
  searchParams,
}: {
  searchParams: { estado?: string; id?: string }
}) {
  const estado = searchParams.estado
  const esPendiente = !estado
  const esOk = estado === 'ok'
  const esError = estado === 'error'
  const esInvalido = estado === 'invalido'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-md shadow-orange-400/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-gray-900">
              Arr<span className="text-orange-500">ivo</span>
            </span>
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          {(esPendiente || esError || esInvalido) && (
            <>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {esInvalido ? 'Enlace no válido' : 'Error al procesar'}
              </h2>
              <p className="text-sm text-gray-500">
                {esInvalido
                  ? 'El enlace de baja no es válido o ya no está disponible.'
                  : 'No se pudo procesar tu solicitud de baja. Si el problema persiste, responde al email para que te eliminemos manualmente.'}
              </p>
            </>
          )}

          {esOk && (
            <>
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Baja registrada</h2>
              <p className="text-sm text-gray-500 mb-6">
                Tu solicitud ha sido procesada. No recibirás más emails de esta dirección.
              </p>
              <p className="text-xs text-gray-400">
                Si te has dado de baja por error, responde directamente al email que recibiste.
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/legal" className="hover:text-gray-600 transition-colors">Política de privacidad</Link>
          {' · '}
          <Link href="/" className="hover:text-gray-600 transition-colors">Arrivo</Link>
        </p>
      </div>
    </div>
  )
}
