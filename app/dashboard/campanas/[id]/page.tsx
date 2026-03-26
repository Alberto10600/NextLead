'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'
import { PAISES_HUNTER, DEPARTAMENTOS_HUNTER, SENIORITY_HUNTER } from '@/types'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'

type Fase = 'idle' | 'descubriendo' | 'enriqueciendo' | 'listo' | 'enviando' | 'completado'

const estadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  borrador:   'default',
  procesando: 'info',
  activa:     'success',
  pausada:    'warning',
  completada: 'default',
}

export default function DetalleCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const [campana, setCampana] = useState<Campana | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [fase, setFase] = useState<Fase>('idle')
  const [progreso, setProgreso] = useState('')
  const [stats, setStats] = useState({ empresas: 0, encontrados: 0, sinResultados: 0 })
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)

  const cargarCampana = useCallback(async () => {
    const res = await fetch(`/api/campanas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCampana(data.campana)
      const lista = data.contactos || []
      setContactos(lista)
      if (lista.length > 0) setFase('listo')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    cargarCampana()
  }, [cargarCampana])

  const buscarContactos = async () => {
    if (!campana) return
    setFase('descubriendo')
    setProgreso('Buscando empresas en Hunter...')

    try {
      // Paso 1: Discover — obtener dominios
      const filtros = campana.filtros_hunter
      const res1 = await fetch('/api/descubrir-empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filtros, limite: 20 }),
      })

      const data1 = await res1.json()

      if (!res1.ok) throw new Error(data1.error || 'Error en Hunter Discover')
      if (!data1.dominios?.length) {
        setToast({ msg: 'Hunter no encontró empresas con estos filtros. Prueba a ampliar la búsqueda.', tipo: 'info' })
        setFase('idle')
        return
      }

      setStats((s) => ({ ...s, empresas: data1.total }))
      setProgreso(`${data1.total} empresas encontradas. Buscando contactos...`)
      setFase('enriqueciendo')

      // Paso 2: Domain Search — buscar contactos en cada dominio
      const res2 = await fetch('/api/enriquecer-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dominios: data1.dominios,
          departamentos: filtros?.departamentos || [],
          seniority: filtros?.seniority || [],
        }),
      })

      const data2 = await res2.json()

      if (!res2.ok) throw new Error(data2.error || 'Error buscando contactos')

      if (data2.total === 0) {
        setToast({ msg: 'Hunter no encontró contactos en estas empresas. Prueba a cambiar departamento o seniority.', tipo: 'info' })
        setFase('idle')
        return
      }

      // Paso 3: Guardar en Supabase
      const res3 = await fetch('/api/guardar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactos: data2.contactos, campana_id: id }),
      })

      const data3 = await res3.json()

      if (!res3.ok) throw new Error(data3.error || 'Error guardando contactos')

      setContactos(data3.contactos)
      setStats({
        empresas: data1.total,
        encontrados: data3.contactos.length,
        sinResultados: data2.dominios_sin_resultados?.length || 0,
      })
      setFase('listo')
      setToast({ msg: `${data3.contactos.length} contactos encontrados en ${data1.total} empresas`, tipo: 'success' })
    } catch (e: unknown) {
      const msg = (e as Error).message
      setToast({ msg, tipo: 'error' })
      setFase('idle')
    }
    setProgreso('')
  }

  const marcarEnviados = async () => {
    setFase('enviando')
    try {
      const res = await fetch('/api/enviar-campana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campana_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ msg: `${data.enviados} contactos marcados como enviados`, tipo: 'success' })
      setFase('completado')
      await cargarCampana()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase('listo')
    }
  }

  const excluirContacto = (contactoId: string) => {
    setContactos((prev) => prev.filter((c) => c.id !== contactoId))
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  if (!campana) {
    return (
      <div className="p-6 text-center text-slate-400">
        Campaña no encontrada.{' '}
        <Link href="/dashboard/campanas" className="text-blue-400">Volver</Link>
      </div>
    )
  }

  const contactosPendientes = contactos.filter((c) => c.estado === 'pendiente')
  const filtros = campana.filtros_hunter

  return (
    <div>
      {/* Header */}
      <div className="border-b border-[#334155] bg-[#1e293b] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campanas" className="text-slate-400 hover:text-slate-200 text-sm">
            ← Campañas
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-base font-semibold text-slate-200">{campana.nombre}</h1>
          <Badge variant={estadoBadge[campana.estado] || 'default'}>{campana.estado}</Badge>
        </div>

        <div className="flex items-center gap-2">
          {fase === 'idle' && (
            <Button onClick={buscarContactos}>
              Buscar contactos
            </Button>
          )}
          {fase === 'listo' && contactosPendientes.length > 0 && (
            <Button onClick={marcarEnviados}>
              Marcar enviados ({contactosPendientes.length})
            </Button>
          )}
          {['descubriendo', 'enriqueciendo', 'enviando'].includes(fase) && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" />
              {progreso || (fase === 'enviando' ? 'Procesando...' : 'Buscando en Hunter...')}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info campaña */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Sector</p>
            <p className="text-slate-300 truncate">{campana.sector || '—'}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">País</p>
            <p className="text-slate-300">
              {PAISES_HUNTER.find((p) => p.value === campana.pais)?.label || campana.pais || '—'}
            </p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Empresas</p>
            <p className="text-slate-300">{stats.empresas > 0 ? stats.empresas : '—'}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Contactos</p>
            <p className="text-slate-300">{contactos.length}</p>
          </div>
        </div>

        {/* Filtros hunter */}
        {filtros && fase === 'idle' && contactos.length === 0 && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Filtros de búsqueda</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {filtros.sector && (
                <>
                  <span className="text-slate-500">Sector</span>
                  <span className="text-slate-300">{filtros.sector}</span>
                </>
              )}
              {filtros.pais && (
                <>
                  <span className="text-slate-500">País</span>
                  <span className="text-slate-300">
                    {PAISES_HUNTER.find((p) => p.value === filtros.pais)?.label || filtros.pais}
                  </span>
                </>
              )}
              {filtros.tamanos?.length > 0 && (
                <>
                  <span className="text-slate-500">Tamaños</span>
                  <span className="text-slate-300">{filtros.tamanos.join(', ')}</span>
                </>
              )}
              {filtros.departamentos?.length > 0 && (
                <>
                  <span className="text-slate-500">Departamentos</span>
                  <span className="text-slate-300">
                    {filtros.departamentos.map((d) => DEPARTAMENTOS_HUNTER[d] || d).join(', ')}
                  </span>
                </>
              )}
              {filtros.seniority?.length > 0 && (
                <>
                  <span className="text-slate-500">Seniority</span>
                  <span className="text-slate-300">
                    {filtros.seniority.map((s) => SENIORITY_HUNTER[s] || s).join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Resumen */}
        {contactos.length > 0 && (
          <p className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">{contactos.length} contactos</span>
            {stats.empresas > 0 && ` en ${stats.empresas} empresas`}
            {stats.sinResultados > 0 && ` · ${stats.sinResultados} empresas sin contactos`}
          </p>
        )}

        {/* Tabla */}
        {contactos.length > 0 && (
          <TablaContactos
            contactos={contactos}
            onExcluir={['listo', 'completado'].includes(fase) ? excluirContacto : undefined}
          />
        )}

        {/* Estado vacío */}
        {fase === 'idle' && contactos.length === 0 && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-16 text-center">
            <p className="text-slate-400 mb-2">
              Pulsa "Buscar contactos" para que Hunter descubra empresas y encuentre sus contactos
            </p>
            <p className="text-xs text-slate-600">
              Hunter buscará empresas por {filtros?.sector ? `sector "${filtros.sector}"` : 'los filtros configurados'} y extraerá emails
            </p>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
