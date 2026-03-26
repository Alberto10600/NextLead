'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'

type Fase = 'idle' | 'enriqueciendo' | 'listo' | 'enviando' | 'completado'

const estadoBadge: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  borrador:   'default',
  procesando: 'info',
  activa:     'success',
  pausada:    'warning',
  completada: 'default',
}

export default function DetalleCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const [campana, setCampana] = useState<Campana & { dominios?: string[] } | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [fase, setFase] = useState<Fase>('idle')
  const [stats, setStats] = useState({ duplicados: 0, errores: 0 })
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)

  const cargarCampana = useCallback(async () => {
    const res = await fetch(`/api/campanas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCampana(data.campana)
      setContactos(data.contactos || [])
      if (data.contactos?.length > 0) setFase('listo')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    cargarCampana()
  }, [cargarCampana])

  const buscarContactos = async () => {
    if (!campana) return
    setFase('enriqueciendo')
    setStats({ duplicados: 0, errores: 0 })

    try {
      const res = await fetch('/api/enriquecer-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dominios: campana.dominios || [],
          cargos_objetivo: campana.cargos_objetivo,
          campana_id: id,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error buscando contactos')
      }

      // Guardar contactos en Supabase
      const res2 = await fetch('/api/guardar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactos: data.contactos,
          campana_id: id,
        }),
      })

      const data2 = await res2.json()

      setStats({ duplicados: data.duplicados_eliminados || 0, errores: 0 })
      setContactos(data2.contactos || data.contactos)
      setFase('listo')

      if (data.contactos.length === 0) {
        setToast({ msg: 'Hunter no encontró contactos para estos dominios. Prueba con otros dominios.', tipo: 'info' })
        setFase('idle')
      } else {
        setToast({ msg: `${data.contactos.length} contactos encontrados`, tipo: 'success' })
      }
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase('idle')
    }
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
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
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
              Buscar contactos con Hunter
            </Button>
          )}
          {fase === 'listo' && contactosPendientes.length > 0 && (
            <Button onClick={marcarEnviados}>
              Marcar como enviados ({contactosPendientes.length})
            </Button>
          )}
          {['enriqueciendo', 'enviando'].includes(fase) && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" />
              {fase === 'enriqueciendo' ? 'Buscando contactos...' : 'Procesando...'}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info campaña */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Sector</p>
            <p className="text-slate-300">{campana.sector}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">País</p>
            <p className="text-slate-300">{campana.pais}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Dominios</p>
            <p className="text-slate-300">{campana.dominios?.length || 0} dominios</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Cargos</p>
            <p className="text-slate-300 truncate">{campana.cargos_objetivo?.join(', ')}</p>
          </div>
        </div>

        {/* Lista de dominios */}
        {campana.dominios && campana.dominios.length > 0 && fase === 'idle' && contactos.length === 0 && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
            <p className="text-xs text-slate-400 font-medium mb-3">DOMINIOS A PROSPECTAR</p>
            <div className="flex flex-wrap gap-2">
              {campana.dominios.map((d) => (
                <span key={d} className="bg-[#0f172a] border border-[#334155] rounded px-2 py-1 text-xs text-slate-300 font-mono">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de resultados */}
        {contactos.length > 0 && (
          <p className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">{contactos.length} contactos encontrados</span>
            {stats.duplicados > 0 && ` · ${stats.duplicados} duplicados eliminados`}
          </p>
        )}

        {/* Tabla de contactos */}
        {contactos.length > 0 && (
          <TablaContactos
            contactos={contactos}
            onExcluir={fase === 'listo' ? excluirContacto : undefined}
          />
        )}

        {/* Estado vacío */}
        {fase === 'idle' && contactos.length === 0 && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-16 text-center">
            <p className="text-slate-400 mb-2">Haz clic en "Buscar contactos con Hunter" para empezar</p>
            <p className="text-xs text-slate-600">Hunter.io buscará emails en los {campana.dominios?.length || 0} dominios de esta campaña</p>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
