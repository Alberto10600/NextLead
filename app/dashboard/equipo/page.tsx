'use client'

import { useState, useEffect } from 'react'
import type { Equipo, MiembroEquipo } from '@/types'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

interface EquipoData {
  equipo: Equipo | null
  miembros: MiembroEquipo[]
  esOwner: boolean
}

export default function EquipoPage() {
  const [data, setData] = useState<EquipoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)

  // Create team form
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [creando, setCreando] = useState(false)

  // Rename team
  const [editandoNombre, setEditandoNombre] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [renombrando, setRenombrando] = useState(false)

  // Invite
  const [emailInvite, setEmailInvite] = useState('')
  const [invitando, setInvitando] = useState(false)

  // Remove member
  const [eliminando, setEliminando] = useState<string | null>(null)

  const cargar = async () => {
    const res = await fetch('/api/equipo')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const crearEquipo = async () => {
    if (!nombreEquipo.trim()) return
    setCreando(true)
    try {
      const res = await fetch('/api/equipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreEquipo.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setToast({ msg: 'Equipo creado', tipo: 'success' })
      await cargar()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setCreando(false)
    }
  }

  const renombrarEquipo = async () => {
    if (!nuevoNombre.trim()) return
    setRenombrando(true)
    try {
      const res = await fetch('/api/equipo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setToast({ msg: 'Nombre actualizado', tipo: 'success' })
      setEditandoNombre(false)
      await cargar()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setRenombrando(false)
    }
  }

  const invitarMiembro = async () => {
    if (!emailInvite.trim()) return
    setInvitando(true)
    try {
      const res = await fetch('/api/equipo/invitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInvite.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setToast({ msg: `Invitación enviada a ${emailInvite.trim()}`, tipo: 'success' })
      setEmailInvite('')
      await cargar()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setInvitando(false)
    }
  }

  const eliminarMiembro = async (id: string) => {
    setEliminando(id)
    try {
      const res = await fetch(`/api/equipo/miembros/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setToast({ msg: 'Miembro eliminado', tipo: 'success' })
      await cargar()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setEliminando(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const { equipo, miembros, esOwner } = data!

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-sm font-semibold text-gray-900">Workspace de equipo</h1>
      </div>

      <div className="p-6 max-w-2xl space-y-5">

        {/* No team yet */}
        {!equipo && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Crear un equipo</p>
              <p className="text-xs text-gray-400 mt-0.5">Invita a compañeros para gestionar campañas conjuntamente</p>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre del equipo</label>
                <input
                  value={nombreEquipo}
                  onChange={(e) => setNombreEquipo(e.target.value)}
                  placeholder="Ej: Equipo de ventas, Agencia XYZ..."
                  onKeyDown={(e) => e.key === 'Enter' && crearEquipo()}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={crearEquipo}
                  disabled={creando || !nombreEquipo.trim()}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                >
                  {creando ? <Spinner size="sm" /> : null}
                  Crear equipo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team info */}
        {equipo && (
          <>
            {/* Team header */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  {editandoNombre ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') renombrarEquipo(); if (e.key === 'Escape') setEditandoNombre(false) }}
                        autoFocus
                        className="bg-white border border-orange-300 rounded-md px-2 py-1 text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-orange-400 w-48"
                      />
                      <button
                        onClick={renombrarEquipo}
                        disabled={renombrando}
                        className="text-xs bg-orange-500 text-white px-2 py-1 rounded-md hover:bg-orange-600 transition-colors"
                      >
                        {renombrando ? <Spinner size="sm" /> : 'Guardar'}
                      </button>
                      <button
                        onClick={() => setEditandoNombre(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{equipo.nombre}</p>
                      {esOwner && (
                        <button
                          onClick={() => { setNuevoNombre(equipo.nombre); setEditandoNombre(true) }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Renombrar"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{miembros.filter(m => m.estado === 'activo').length} miembro{miembros.filter(m => m.estado === 'activo').length !== 1 ? 's' : ''} activo{miembros.filter(m => m.estado === 'activo').length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                    {esOwner ? 'Admin' : 'Miembro'}
                  </span>
                </div>
              </div>

              {/* Member list */}
              <div className="divide-y divide-gray-50">
                {miembros.map((m) => (
                  <div key={m.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 uppercase">
                        {m.email[0]}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900">{m.email}</p>
                        <p className="text-[11px] text-gray-400 capitalize">{m.rol}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        m.estado === 'activo'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${m.estado === 'activo' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        {m.estado === 'activo' ? 'Activo' : 'Pendiente'}
                      </span>
                      {esOwner && m.rol !== 'admin' && (
                        <button
                          onClick={() => eliminarMiembro(m.id)}
                          disabled={eliminando === m.id}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
                          title="Eliminar del equipo"
                        >
                          {eliminando === m.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite section (owner only) */}
            {esOwner && (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Invitar miembro</p>
                  <p className="text-xs text-gray-400 mt-0.5">Se enviará un email con el enlace de invitación</p>
                </div>
                <div className="px-5 py-5">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInvite}
                      onChange={(e) => setEmailInvite(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && invitarMiembro()}
                      placeholder="email@empresa.com"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                    <button
                      onClick={invitarMiembro}
                      disabled={invitando || !emailInvite.trim()}
                      className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      {invitando ? <Spinner size="sm" /> : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                        </svg>
                      )}
                      Invitar
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Los miembros invitados podrán ver y editar todas las campañas del equipo.
                  </p>
                </div>
              </div>
            )}

            {/* Info for non-owners */}
            {!esOwner && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-4">
                <p className="text-sm text-amber-800">
                  Eres miembro de este equipo. El administrador gestiona los miembros y permisos.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
