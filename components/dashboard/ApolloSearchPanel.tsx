'use client'

import { useState } from 'react'
import type { Campana } from '@/types'

const PAIS_ISO_A_APOLLO: Record<string, string> = {
  ES: 'Spain', MX: 'Mexico', AR: 'Argentina', CO: 'Colombia',
  CL: 'Chile', PE: 'Peru', US: 'United States', GB: 'United Kingdom',
  FR: 'France', DE: 'Germany', IT: 'Italy', PT: 'Portugal',
  NL: 'Netherlands', BE: 'Belgium', CH: 'Switzerland', PL: 'Poland', BR: 'Brazil',
}
function paisApollo(iso: string) { return PAIS_ISO_A_APOLLO[iso] || iso }

interface Props {
  campana: Campana
  onContactosGuardados: (n: number) => void
  onError: (msg: string) => void
}

export default function ApolloSearchPanel({ campana, onContactosGuardados, onError }: Props) {
  const [buscando, setBuscando] = useState(false)


  const perfil = campana.preferencias_busqueda?.perfil_apollo
  const objetivo = campana.preferencias_busqueda?.objetivo_contactos || 25

  if (!perfil) return null

  const buscarYGuardar = async () => {
    setBuscando(true)
    try {
      // 1. Buscar en Apollo
      const res = await fetch('/api/buscar-apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulos: perfil.titulos,
          seniorities: perfil.seniorities,
          pais: campana.pais ? paisApollo(campana.pais) : undefined,
          industrias: perfil.industrias,
          limite: objetivo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error buscando en Apollo')

      const contactos = data.contactos || []
      if (contactos.length === 0) {
        onError('Apollo no encontró contactos con ese perfil. Prueba a ampliar los filtros.')
        return
      }

      // 2. Guardar contactos
      const resGuardar = await fetch('/api/guardar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactos, campana_id: campana.id }),
      })
      const dataGuardar = await resGuardar.json()
      if (!resGuardar.ok) throw new Error(dataGuardar.error || 'Error guardando contactos')

      setPreview({ total: contactos.length, muestra: dataGuardar.contactos?.length || contactos.length })
      onContactosGuardados(dataGuardar.contactos?.length || contactos.length)
    } catch (e: unknown) {
      onError((e as Error).message)
    } finally {
      setBuscando(false)
    }
  }

  const isTop = perfil.seniorities.includes('c_suite') || perfil.seniorities.includes('owner') || perfil.seniorities.includes('founder')
  const creditosEst = Math.ceil(objetivo * (isTop ? 1.5 : 1.3))

  return (
    <div className="bg-white border-2 border-orange-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Buscar con Apollo</p>
            <p className="text-xs text-gray-500">Búsqueda directa por perfil — sin pasar por dominios</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">Perfil configurado</p>
          <p className="text-xs font-semibold text-orange-600">{perfil.label}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Objetivo</p>
            <p className="text-sm font-bold text-gray-900">{objetivo} contactos</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Cargo</p>
            <p className="text-sm font-bold text-gray-900">{perfil.label}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Créditos est.</p>
            <p className="text-sm font-bold text-orange-600">~{creditosEst}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 mb-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Títulos que buscará Apollo</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            {perfil.titulos.slice(0, 6).join(' · ')}
            {perfil.titulos.length > 6 && <span className="text-gray-400"> +{perfil.titulos.length - 6} más</span>}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={buscarYGuardar}
            disabled={buscando}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {buscando ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Buscando en Apollo...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Buscar {objetivo} {perfil.label}
              </>
            )}
          </button>
          <p className="text-[11px] text-gray-400">
            Solo contactos verificados · Deduplicados automáticamente
          </p>
        </div>
      </div>
    </div>
  )
}
