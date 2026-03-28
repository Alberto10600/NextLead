'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Spinner from '@/components/ui/Spinner'

type Estado = 'cargando' | 'listo' | 'invalido' | 'ya_activo' | 'aceptado' | 'error'

export default function UnirseEquipoPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') || ''

  const [estado, setEstado] = useState<Estado>('cargando')
  const [equipoNombre, setEquipoNombre] = useState('')
  const [emailInvite, setEmailInvite] = useState('')
  const [usuarioLogueado, setUsuarioLogueado] = useState(false)
  const [aceptando, setAceptando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const init = async () => {
      if (!token) { setEstado('invalido'); return }

      // Check invite validity
      const res = await fetch(`/api/equipo/aceptar?token=${token}`)
      const data = await res.json()

      if (!res.ok || data.error) { setEstado('invalido'); return }
      if (data.ya_activo) { setEstado('ya_activo'); return }

      setEquipoNombre(data.equipo_nombre || '')
      setEmailInvite(data.email || '')

      // Check if user is logged in
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUsuarioLogueado(!!user)
      setEstado('listo')
    }
    init()
  }, [token])

  const aceptarInvitacion = async () => {
    setAceptando(true)
    try {
      const res = await fetch('/api/equipo/aceptar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setEstado('aceptado')
      setTimeout(() => router.push('/dashboard/equipo'), 2000)
    } catch (e: unknown) {
      setErrorMsg((e as Error).message)
      setEstado('error')
    } finally {
      setAceptando(false)
    }
  }

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

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {estado === 'cargando' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500">Verificando invitación...</p>
            </div>
          )}

          {estado === 'invalido' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Invitación no válida</h2>
              <p className="text-sm text-gray-500 mb-6">Este enlace de invitación no existe o ha expirado.</p>
              <Link href="/dashboard" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                Ir al dashboard →
              </Link>
            </div>
          )}

          {estado === 'ya_activo' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Invitación ya utilizada</h2>
              <p className="text-sm text-gray-500 mb-6">Este enlace ya fue aceptado anteriormente.</p>
              <Link href="/dashboard/equipo" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
                Ver el equipo →
              </Link>
            </div>
          )}

          {estado === 'listo' && (
            <div>
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1 text-center">
                Invitación al equipo
              </h2>
              {equipoNombre && (
                <p className="text-center text-sm text-gray-500 mb-6">
                  Te han invitado a unirte a <strong className="text-gray-900">&ldquo;{equipoNombre}&rdquo;</strong>
                </p>
              )}

              {usuarioLogueado ? (
                <button
                  onClick={aceptarInvitacion}
                  disabled={aceptando}
                  className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {aceptando ? <Spinner size="sm" /> : null}
                  Aceptar invitación
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Necesitas iniciar sesión para aceptar la invitación.
                  </p>
                  <Link
                    href={`/login?next=/equipo/unirse?token=${token}`}
                    className="w-full inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Iniciar sesión para unirse
                  </Link>
                  <Link
                    href={`/registro?next=/equipo/unirse?token=${token}`}
                    className="w-full inline-flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
                  >
                    Crear cuenta nueva
                  </Link>
                  {emailInvite && (
                    <p className="text-center text-xs text-gray-400">
                      Invitado como: {emailInvite}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {estado === 'aceptado' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">¡Bienvenido al equipo!</h2>
              <p className="text-sm text-gray-500">Redirigiendo al workspace...</p>
            </div>
          )}

          {estado === 'error' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Error al aceptar</h2>
              <p className="text-sm text-red-500 mb-6">{errorMsg}</p>
              <button
                onClick={() => setEstado('listo')}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
