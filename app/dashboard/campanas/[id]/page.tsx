'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto } from '@/types'
import BarraProgreso from '@/components/dashboard/BarraProgreso'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'

type Fase = 'idle' | 'buscando' | 'enriqueciendo' | 'generando' | 'listo' | 'enviando' | 'completado'

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
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 })
  const [stats, setStats] = useState({ duplicados: 0, errores: 0 })
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)

  const cargarCampana = useCallback(async () => {
    const res = await fetch(`/api/campanas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCampana(data.campana)
      setContactos(data.contactos || [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    cargarCampana()
  }, [cargarCampana])

  const iniciarProceso = async () => {
    if (!campana) return
    setFase('buscando')
    setStats({ duplicados: 0, errores: 0 })

    try {
      // Paso 1: Buscar dominios
      const res1 = await fetch('/api/buscar-dominios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: campana.sector,
          pais: campana.pais,
          cargos_objetivo: campana.cargos_objetivo,
        }),
      })

      if (!res1.ok) {
        const err = await res1.json()
        throw new Error(err.error || 'Error buscando dominios')
      }

      const { dominios } = await res1.json()
      setFase('enriqueciendo')
      setProgreso({ actual: 0, total: dominios.length })

      // Paso 2: Enriquecer contactos
      const res2 = await fetch('/api/enriquecer-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dominios,
          cargos_objetivo: campana.cargos_objetivo,
          campana_id: id,
        }),
      })

      if (!res2.ok) {
        const err = await res2.json()
        throw new Error(err.error || 'Error enriqueciendo contactos')
      }

      const { contactos: contactosCrudos, duplicados_eliminados } = await res2.json()
      setStats((s) => ({ ...s, duplicados: duplicados_eliminados }))
      setFase('generando')
      setProgreso({ actual: 0, total: contactosCrudos.length })

      // Paso 3: Generar emails
      const res3 = await fetch('/api/generar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactos: contactosCrudos,
          descripcion_agencia: campana.descripcion_agencia,
          sector: campana.sector,
          campana_id: id,
        }),
      })

      if (!res3.ok) {
        const err = await res3.json()
        throw new Error(err.error || 'Error generando emails')
      }

      const { contactos_procesados, errores } = await res3.json()
      setStats((s) => ({ ...s, errores: errores.length }))
      setContactos(contactos_procesados)
      setFase('listo')

    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase('idle')
    }
  }

  const enviarCampana = async () => {
    setFase('enviando')
    try {
      const res = await fetch('/api/enviar-campana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campana_id: id }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setToast({ msg: `Créditos insuficientes. Tienes ${data.creditos_restantes} y necesitas ${data.contactos_a_enviar}.`, tipo: 'error' })
          setFase('listo')
          return
        }
        throw new Error(data.error)
      }

      setToast({ msg: `¡${data.enviados} emails enviados correctamente!`, tipo: 'success' })
      setFase('completado')
      await cargarCampana()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase('listo')
    }
  }

  const excluirContacto = async (contactoId: string) => {
    setContactos((prev) => prev.filter((c) => c.id !== contactoId))
  }

  const fasesBarra = [
    { label: 'Buscando empresas',     completada: ['enriqueciendo','generando','listo','enviando','completado'].includes(fase), activa: fase === 'buscando' },
    { label: 'Encontrando contactos', completada: ['generando','listo','enviando','completado'].includes(fase), activa: fase === 'enriqueciendo' },
    { label: 'Generando emails',      completada: ['listo','enviando','completado'].includes(fase), activa: fase === 'generando' },
    { label: 'Listo para enviar',     completada: ['enviando','completado'].includes(fase), activa: fase === 'listo' },
  ]

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
        <Link href="/dashboard/campanas" className="text-blue-400">Volver a campañas</Link>
      </div>
    )
  }

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
          {fase === 'idle' && contactos.length === 0 && (
            <Button onClick={iniciarProceso}>
              Buscar contactos
            </Button>
          )}
          {fase === 'listo' && (
            <Button onClick={enviarCampana} variant="primary">
              Enviar campaña ({contactos.filter((c) => c.estado === 'pendiente').length} emails)
            </Button>
          )}
          {['buscando', 'enriqueciendo', 'generando', 'enviando'].includes(fase) && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner size="sm" />
              Procesando...
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Info campaña */}
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Sector</p>
            <p className="text-slate-300">{campana.sector}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">País</p>
            <p className="text-slate-300">{campana.pais}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-md px-3 py-2">
            <p className="text-xs text-slate-500">Cargos</p>
            <p className="text-slate-300 truncate">{campana.cargos_objetivo?.join(', ')}</p>
          </div>
        </div>

        {/* Barra de progreso */}
        {fase !== 'idle' || contactos.length > 0 ? (
          <BarraProgreso
            fases={fasesBarra}
            progreso={
              progreso.total > 0
                ? { actual: progreso.actual, total: progreso.total }
                : undefined
            }
          />
        ) : null}

        {/* Resumen */}
        {(stats.duplicados > 0 || stats.errores > 0 || contactos.length > 0) && (
          <p className="text-sm text-slate-400">
            <span className="text-slate-200 font-medium">{contactos.length} contactos</span>
            {stats.duplicados > 0 && ` · ${stats.duplicados} duplicados eliminados`}
            {stats.errores > 0 && ` · ${stats.errores} errores`}
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
            <p className="text-slate-400 mb-4">
              Haz clic en "Buscar contactos" para iniciar el proceso automatizado
            </p>
            <p className="text-xs text-slate-600">
              Claude AI buscará empresas → Hunter.io encontrará contactos → Claude generará emails personalizados
            </p>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.tipo}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
