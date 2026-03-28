'use client'

import { useState, useEffect } from 'react'
import type { Perfil } from '@/types'
import { LIMITES_PLAN } from '@/types'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  // Datos personales
  const [nombre, setNombre] = useState('')
  const [agencia, setAgencia] = useState('')
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)


  // Contraseña
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [guardandoPass, setGuardandoPass] = useState(false)

  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    fetch('/api/perfil')
      .then((r) => r.json())
      .then(({ perfil }) => {
        setPerfil(perfil)
        setNombre(perfil?.nombre || '')
        setAgencia(perfil?.agencia || '')
        setLoading(false)
      })
  }, [])

  const guardarPerfil = async () => {
    setGuardandoPerfil(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, agencia }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPerfil(data.perfil)
      setToast({ msg: 'Perfil actualizado', tipo: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const cambiarPassword = async () => {
    if (passNueva !== passConfirm) {
      setToast({ msg: 'Las contraseñas no coinciden', tipo: 'error' })
      return
    }
    if (passNueva.length < 8) {
      setToast({ msg: 'La contraseña debe tener al menos 8 caracteres', tipo: 'error' })
      return
    }
    setGuardandoPass(true)
    try {
      const res = await fetch('/api/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password_actual: passActual, password_nueva: passNueva }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPassActual('')
      setPassNueva('')
      setPassConfirm('')
      setToast({ msg: 'Contraseña actualizada correctamente', tipo: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setGuardandoPass(false)
    }
  }

  const gestionarPlan = async () => {
    setToast({ msg: 'Gestión de planes próximamente disponible', tipo: 'info' })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  if (!perfil) return null

  const limites = LIMITES_PLAN[perfil.plan]

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-sm font-semibold text-gray-900">Perfil y cuenta</h1>
      </div>

      <div className="p-6 max-w-2xl space-y-5">

        {/* Datos personales */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Datos personales</p>
            <p className="text-xs text-gray-400 mt-0.5">Tu nombre e información de agencia</p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                value={perfil.email}
                disabled
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre de agencia</label>
              <input
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
                placeholder="Tu agencia"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={guardarPerfil}
                disabled={guardandoPerfil}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                {guardandoPerfil ? <Spinner size="sm" /> : null}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>

        {/* Plan actual */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Plan actual</p>
            <p className="text-xs text-gray-400 mt-0.5">Tu suscripción y límites</p>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 capitalize">
                  {perfil.plan}
                </span>
                <span className="text-sm text-gray-500">
                  {limites.precio_mensual === 0 ? 'Gratis' : `€${limites.precio_mensual}/mes`}
                </span>
              </div>
              <button
                onClick={gestionarPlan}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-md transition-colors"
              >
                {perfil.plan === 'free' ? 'Actualizar plan' : 'Gestionar suscripción'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Contactos/mes', value: limites.contactos_mes.toLocaleString() },
                { label: 'Campañas activas', value: limites.campanas_activas === 999 ? '∞' : String(limites.campanas_activas) },
                { label: 'Follow-ups auto', value: limites.seguimientos === 0 ? '—' : String(limites.seguimientos) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Contraseña</p>
            <p className="text-xs text-gray-400 mt-0.5">Actualiza tu contraseña de acceso</p>
          </div>
          <div className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Contraseña actual</label>
              <input
                type="password"
                value={passActual}
                onChange={(e) => setPassActual(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                value={passNueva}
                onChange={(e) => setPassNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={passConfirm}
                onChange={(e) => setPassConfirm(e.target.value)}
                placeholder="Repite la nueva contraseña"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={cambiarPassword}
                disabled={guardandoPass || !passActual || !passNueva || !passConfirm}
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                {guardandoPass ? <Spinner size="sm" /> : null}
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>

      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
