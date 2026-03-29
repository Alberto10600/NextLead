'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Campana, Contacto, Plantilla, Tono, PreferenciasBusqueda, BusquedaHistorial } from '@/types'
import type { HunterContacto } from '@/lib/hunter'
import TablaContactos from '@/components/dashboard/TablaContactos'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

type Fase = 'idle' | 'buscando' | 'listo' | 'generando' | 'analizando' | 'enviando' | 'completado'

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  borrador:   { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Borrador' },
  procesando: { bg: 'bg-blue-50',     text: 'text-blue-600',    label: 'Procesando' },
  activa:     { bg: 'bg-emerald-50',  text: 'text-emerald-600', label: 'Activa' },
  pausada:    { bg: 'bg-amber-50',    text: 'text-amber-600',   label: 'Pausada' },
  completada: { bg: 'bg-gray-100',    text: 'text-gray-500',    label: 'Completada' },
}

function parseDominios(texto: string): string[] {
  return texto
    .split(/[\n,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0])
    .filter((d) => d.length > 2 && d.includes('.'))
}

export default function DetalleCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [campana, setCampana] = useState<Campana | null>(null)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [fase, setFase] = useState<Fase>('idle')
  const [stats, setStats] = useState({ sinResultados: 0 })
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' | 'info' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [dominiosTexto, setDominiosTexto] = useState('')
  const [mostrarAnadir, setMostrarAnadir] = useState(false)
  const [dominiosNuevos, setDominiosNuevos] = useState('')
  const [mostrarGenerador, setMostrarGenerador] = useState(false)
  const [descAgencia, setDescAgencia] = useState('')
  const [sectorObjetivo, setSectorObjetivo] = useState('')
  const [progGeneracion, setProgGeneracion] = useState<{ hecho: number; total: number } | null>(null)
  const [creandoSeguimientos, setCreandoSeguimientos] = useState(false)
  const [modoBusqueda, setModoBusqueda] = useState<'dominios' | 'sector'>('dominios')
  const [sectorBusqueda, setSectorBusqueda] = useState('')
  const [paisBusqueda, setPaisBusqueda] = useState('España')
  const [regionBusqueda, setRegionBusqueda] = useState('')
  const [buscandoSector, setBuscandoSector] = useState(false)
  const [sugirendoPerfiles, setSugirendoPerfiles] = useState(false)
  const [perfilesSugeridos, setPerfilesSugeridos] = useState<string[]>([])  // chips sugeridos por IA
  const [maxPorDominioInput, setMaxPorDominioInput] = useState<string>('3')  // custom text input
  const [historialBusquedas, setHistorialBusquedas] = useState<BusquedaHistorial[]>([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [dominiosSugeridos, setDominiosSugeridos] = useState<string[]>([])
  const [modoEnvio, setModoEnvio] = useState<'test' | 'real'>('test')
  // Capa 1: límite de contactos por dominio
  const [maxPorDominio, setMaxPorDominio] = useState<number>(3)
  // Capa 2: contactos pendientes de filtrado (entre Hunter y guardar)
  const [contactosPrevio, setContactosPrevio] = useState<HunterContacto[]>([])

  const [filtroCargo, setFiltroCargo] = useState('')
  // Capa 3: selección de dominios sugeridos por IA
  const [dominiosSeleccionados, setDominiosSeleccionados] = useState<Set<string>>(new Set())
  // P2-6 tono
  const [tono, setTono] = useState<Tono>('cercano')
  // P2-4 días de seguimiento
  const [diasSeguimiento, setDiasSeguimiento] = useState<number[]>([3, 7, 14])
  // P2-2 plantillas
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false)
  // P2-3 throttling
  const [limiteDiario, setLimiteDiario] = useState(0)

  const cargarCampana = useCallback(async () => {
    const res = await fetch(`/api/campanas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setCampana(data.campana)
      const lista = data.contactos || []
      setContactos(lista)
      if (lista.length > 0) setFase('listo')
      if (data.campana?.dominios?.length) {
        setDominiosTexto(data.campana.dominios.join('\n'))
      }
      // Pre-fill generator fields from saved campaign data
      if (data.campana?.descripcion_agencia) setDescAgencia(data.campana.descripcion_agencia)
      if (data.campana?.sector) setSectorObjetivo(data.campana.sector)
      if (data.campana?.tono) setTono(data.campana.tono as Tono)
      if (data.campana?.dias_seguimiento?.length) setDiasSeguimiento(data.campana.dias_seguimiento)
      if (data.campana?.limite_diario !== undefined) setLimiteDiario(data.campana.limite_diario)
      // Cargar preferencias de búsqueda guardadas
      const prefs = data.campana?.preferencias_busqueda
      if (prefs) {
        if (prefs.max_por_dominio) { setMaxPorDominio(prefs.max_por_dominio); setMaxPorDominioInput(String(prefs.max_por_dominio)) }
        if (prefs.filtro_cargo) setFiltroCargo(prefs.filtro_cargo)
        if (prefs.historial?.length) setHistorialBusquedas(prefs.historial)
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { cargarCampana() }, [cargarCampana])

  // Load plantillas once
  useEffect(() => {
    fetch('/api/plantillas').then(r => r.json()).then(d => setPlantillas(d.plantillas || []))
  }, [])

  // Auto-save description with debounce
  useEffect(() => {
    if (!campana || !descAgencia.trim()) return
    const timer = setTimeout(() => {
      fetch(`/api/campanas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion_agencia: descAgencia }),
      })
    }, 800)
    return () => clearTimeout(timer)
  }, [descAgencia]) // eslint-disable-line react-hooks/exhaustive-deps

  const guardarPreferencias = async (extra?: Partial<PreferenciasBusqueda>) => {
    const nuevoHistorial = extra?.historial ?? historialBusquedas
    const prefs: PreferenciasBusqueda = {
      max_por_dominio: maxPorDominio,
      filtro_cargo: filtroCargo || undefined,
      historial: nuevoHistorial.slice(0, 5),
      ...extra,
    }
    await fetch(`/api/campanas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferencias_busqueda: prefs }),
    })
  }

  const dominiosParsed = parseDominios(dominiosTexto)
  const dominiosNuevosParsed = parseDominios(dominiosNuevos)

  // Guardar dominios en la BD
  const guardarDominios = async (dominios: string[]) => {
    await fetch(`/api/campanas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dominios }),
    })
  }

  // Prefijos de email genérico a excluir (siempre activo, silencioso)
  const EMAILS_GENERICOS = ['info', 'contact', 'contacto', 'hola', 'hello', 'admin', 'soporte',
    'support', 'noreply', 'no-reply', 'ventas', 'marketing', 'ayuda', 'help', 'accounts',
    'billing', 'reception', 'recepcion', 'general', 'enquiries', 'sales', 'office', 'oficina']

  // Sinónimos para que "CEO" también coincida con "Chief Executive Officer", "Founder", etc.
  const SINONIMOS_CARGO: Record<string, string[]> = {
    'ceo':       ['chief executive', 'director ejecutivo', 'director general', 'founder', 'cofound', 'co-found', 'fundador', 'presidente'],
    'cto':       ['chief technology', 'director de tecnología', 'director tecnológico', 'tech lead', 'head of tech', 'head of engineering'],
    'cmo':       ['chief marketing', 'director de marketing', 'marketing director', 'head of marketing', 'vp marketing'],
    'cfo':       ['chief financial', 'director financiero', 'finance director', 'head of finance'],
    'coo':       ['chief operating', 'director de operaciones', 'operations director'],
    'cso':       ['chief sales', 'director de ventas', 'sales director', 'head of sales', 'vp sales'],
    'founder':   ['fundador', 'cofound', 'co-found', 'ceo', 'owner', 'propietario'],
    'director':  ['head of', 'vp ', 'vice president', 'responsable de'],
    'manager':   ['gerente', 'responsable', 'lead ', 'jefe de'],
    'growth':    ['crecimiento', 'adquisición', 'acquisition'],
  }

  const aplicarFiltros = (lista: HunterContacto[]) => {
    let filtrada = lista

    // Excluir genéricos siempre (silencioso)
    filtrada = filtrada.filter((c) => {
      const prefijo = c.email.split('@')[0].toLowerCase()
      return !EMAILS_GENERICOS.some((g) => prefijo === g || prefijo.startsWith(g + '.'))
    })

    if (filtroCargo.trim()) {
      const keywords = filtroCargo.toLowerCase().split(',').map((k) => k.trim()).filter(Boolean)
      filtrada = filtrada.filter((c) => {
        // Contactos sin cargo: los incluimos si buscamos roles muy genéricos,
        // los excluimos si el filtro es específico
        const cargo = (c.cargo || '').toLowerCase()
        if (!cargo) {
          // Sin cargo → incluir solo si algún keyword es muy corto (probable error de filtro)
          return false
        }
        return keywords.some((kw) => {
          // Coincidencia directa
          if (cargo.includes(kw)) return true
          // Coincidencia por sinónimos
          const sinonimos = SINONIMOS_CARGO[kw] || []
          if (sinonimos.some((s) => cargo.includes(s))) return true
          // Si el cargo contiene el kw como palabra completa (ej "ceo" en "ceo & founder")
          const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
          return regex.test(cargo)
        })
      })
    }
    return filtrada
  }

  const buscarContactos = async (dominios: string[]) => {
    if (!campana || dominios.length === 0) return
    setFase('buscando')

    try {
      // Guardar dominios en BD antes de buscar
      await guardarDominios(Array.from(new Set([...dominiosParsed, ...dominios])))

      const res = await fetch('/api/enriquecer-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dominios, max_por_dominio: maxPorDominio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error buscando contactos')

      if (data.total === 0) {
        setToast({ msg: 'Hunter no encontró contactos en estos dominios.', tipo: 'info' })
        setFase(contactos.length > 0 ? 'listo' : 'idle')
        return
      }

      // Capa 2: mostrar panel de filtrado antes de guardar
      setContactosPrevio(data.contactos)
      setStats({ sinResultados: data.dominios_sin_resultados?.length || 0 })
      setFase('listo')
      // Guardar preferencias actuales
      await guardarPreferencias()
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase(contactos.length > 0 ? 'listo' : 'idle')
    }
  }

  const guardarContactosFiltrados = async () => {
    const filtrados = contactosFiltradosPrevio
    if (filtrados.length === 0) {
      setToast({ msg: 'Los filtros excluyen todos los contactos. Ajusta los criterios.', tipo: 'info' })
      return
    }
    setFase('buscando')
    try {
      const res = await fetch('/api/guardar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactos: filtrados, campana_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error guardando contactos')

      setContactos(prev => [...prev, ...data.contactos])
      setContactosPrevio([])
      setFase('listo')
      setMostrarAnadir(false)
      setDominiosNuevos('')
      const cola = data.en_cola > 0 ? ` · ${data.en_cola} superan el límite del plan` : ''
      setToast({ msg: `${data.contactos.length} contactos guardados${cola}`, tipo: 'success' })
      // Añadir entrada al historial
      const entrada: BusquedaHistorial = {
        fecha: new Date().toISOString(),
        dominios: dominiosParsed.slice(0, 10),
        encontrados: contactosFiltradosPrevio.length + contactosExcluidosPrevio,
        guardados: data.contactos.length,
        filtro_cargo: filtroCargo || undefined,
      }
      const nuevoHistorial = [entrada, ...historialBusquedas].slice(0, 5)
      setHistorialBusquedas(nuevoHistorial)
      await guardarPreferencias({ historial: nuevoHistorial })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
      setFase(contactos.length > 0 ? 'listo' : 'idle')
    }
  }

  const buscarPorSector = async () => {
    if (!sectorBusqueda.trim()) return
    setBuscandoSector(true)
    setDominiosSugeridos([])
    try {
      const res = await fetch('/api/buscar-por-sector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sector: sectorBusqueda, pais: paisBusqueda, cantidad: 15, region: regionBusqueda || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDominiosSugeridos(data.dominios)
      setDominiosSeleccionados(new Set(data.dominios))
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setBuscandoSector(false)
    }
  }

  const excluirContacto = (contactoId: string) => {
    setContactos((prev) => prev.filter((c) => c.id !== contactoId))
  }

  const guardarComoPlantilla = async () => {
    if (!descAgencia.trim()) return
    const nombre = window.prompt('Nombre para esta plantilla:', `${sectorObjetivo || 'Mi pitch'} — ${tono}`)
    if (!nombre) return
    setGuardandoPlantilla(true)
    try {
      const res = await fetch('/api/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, sector: sectorObjetivo, descripcion: descAgencia, tono }),
      })
      const data = await res.json()
      if (res.ok) {
        setPlantillas(prev => [data.plantilla, ...prev])
        setToast({ msg: 'Plantilla guardada', tipo: 'success' })
      }
    } finally {
      setGuardandoPlantilla(false)
    }
  }

  const cargarPlantilla = (p: Plantilla) => {
    setDescAgencia(p.descripcion)
    if (p.sector) setSectorObjetivo(p.sector)
    setTono(p.tono)
  }

  const sugerirPerfiles = async () => {
    const desc = campana?.descripcion_agencia || descAgencia
    if (!desc?.trim()) {
      setToast({ msg: 'Primero completa la descripción de tu servicio en "Generar emails IA"', tipo: 'info' })
      return
    }
    setSugirendoPerfiles(true)
    try {
      const res = await fetch('/api/sugerir-perfiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: desc }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.perfiles?.length) {
        setPerfilesSugeridos(data.perfiles)
        setToast({ msg: `${data.perfiles.length} perfiles sugeridos — haz clic para activarlos`, tipo: 'success' })
      }
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setSugirendoPerfiles(false)
    }
  }

  const analizarContactos = async () => {
    const sinAnalisis = contactos.filter((c) => !c.analisis_empresa)
    if (sinAnalisis.length === 0) {
      setToast({ msg: 'Todos los contactos ya tienen análisis', tipo: 'info' })
      return
    }
    setFase('analizando')
    try {
      const res = await fetch('/api/analizar-contactos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacto_ids: sinAnalisis.map((c) => c.id) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error analizando')
      await cargarCampana()
      setToast({ msg: `${data.analizados} empresas analizadas`, tipo: 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setFase('listo')
    }
  }

  const crearSeguimientos = async () => {
    setCreandoSeguimientos(true)
    try {
      const res = await fetch('/api/crear-seguimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campana_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error creando seguimientos')
      setToast({ msg: data.creados > 0 ? `${data.creados} seguimientos creados para ${data.contactos_afectados} contactos` : data.mensaje, tipo: data.creados > 0 ? 'success' : 'info' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setCreandoSeguimientos(false)
    }
  }

  const generarEmails = async () => {
    const sinEmail = contactos.filter((c) => !c.email_generado)
    if (sinEmail.length === 0) {
      setToast({ msg: 'Todos los contactos ya tienen email generado', tipo: 'info' })
      return
    }
    setFase('generando')
    setProgGeneracion({ hecho: 0, total: sinEmail.length })

    // Save campaign settings for next time
    await fetch(`/api/campanas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion_agencia: descAgencia,
        sector: sectorObjetivo,
        tono,
        dias_seguimiento: diasSeguimiento,
        limite_diario: limiteDiario,
      }),
    })

    try {
      const res = await fetch('/api/generar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacto_ids: sinEmail.map((c) => c.id),
          descripcion_agencia: descAgencia,
          sector: sectorObjetivo,
          tono,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando emails')

      setMostrarGenerador(false)
      await cargarCampana()

      const msg = data.errores?.length
        ? `${data.generados}/${sinEmail.length} emails generados. ${data.errores.length} errores.`
        : `${data.generados} emails generados con IA`
      setToast({ msg, tipo: data.errores?.length ? 'info' : 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setFase('listo')
      setProgGeneracion(null)
    }
  }

  const enviarCampana = async () => {
    const conEmail = contactos.filter((c) => c.email_generado && c.estado === 'pendiente')
    if (conEmail.length === 0) {
      setToast({ msg: 'No hay contactos pendientes con email generado', tipo: 'info' })
      return
    }

    if (modoEnvio === 'real') {
      const ok = window.confirm(
        `¿Enviar ${conEmail.length} emails REALES a los contactos?\n\nEsto enviará correos electrónicos reales desde tu cuenta de Resend.`
      )
      if (!ok) return
    }

    setFase('enviando')
    try {
      const res = await fetch('/api/enviar-campana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campana_id: id, modo: modoEnvio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error enviando')

      await cargarCampana()
      const cola = data.en_cola > 0 ? ` · ${data.en_cola} en cola para mañana` : ''
      const msg = modoEnvio === 'test'
        ? `${data.enviados} emails marcados (modo test)${cola}`
        : `${data.enviados} emails enviados${data.errores?.length ? ` · ${data.errores.length} errores` : ''}${cola}`
      setToast({ msg, tipo: data.errores?.length ? 'error' : 'success' })
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, tipo: 'error' })
    } finally {
      setFase('listo')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  if (!campana) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-700 font-medium mb-1">Campaña no encontrada</p>
        <Link href="/dashboard/campanas" className="text-sm text-orange-500 hover:text-orange-600 mt-4">
          ← Volver a campañas
        </Link>
      </div>
    )
  }

  const badge = estadoBadge[campana.estado] || estadoBadge.borrador
  const enProceso = fase === 'buscando' || fase === 'enviando' || fase === 'generando' || fase === 'analizando'
  const tieneContactos = contactos.length > 0
  const sinEmailGenerado = contactos.filter((c) => !c.email_generado).length
  // Capa 2: precompute filtered contacts for the filter panel
  const contactosFiltradosPrevio = aplicarFiltros(contactosPrevio)
  const contactosExcluidosPrevio = contactosPrevio.length - contactosFiltradosPrevio.length

  return (
    <div className="min-h-full">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/dashboard/campanas" className="text-gray-400 hover:text-gray-700 text-sm transition-colors shrink-0">
            Campañas
          </Link>
          <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h1 className="text-sm font-semibold text-gray-900 truncate">{campana.nombre}</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {fase === 'buscando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Buscando en Hunter...</span>
            </div>
          )}
          {fase === 'enviando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Enviando{modoEnvio === 'test' ? ' (test)' : ''}...</span>
            </div>
          )}
          {fase === 'analizando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Analizando empresas...</span>
            </div>
          )}
          {fase === 'generando' && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{progGeneracion ? `Generando ${progGeneracion.hecho}/${progGeneracion.total}...` : 'Generando emails...'}</span>
            </div>
          )}

          {/* Stats */}
          {campana.total_enviados > 0 && (
            <Link
              href={`/dashboard/campanas/${id}/stats`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-md transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Stats
            </Link>
          )}

          {/* Editar */}
          <button
            onClick={() => router.push(`/dashboard/campanas/${id}/editar`)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-md transition-colors"
          >
            Editar
          </button>

          {/* Analizar empresas */}
          {tieneContactos && !enProceso && contactos.some((c) => !c.analisis_empresa) && (
            <button
              onClick={analizarContactos}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Analizar · {contactos.filter((c) => !c.analisis_empresa).length}
            </button>
          )}

          {/* Generar emails con IA */}
          {tieneContactos && !enProceso && sinEmailGenerado > 0 && (
            <button
              onClick={() => { setMostrarGenerador((v) => !v); setMostrarAnadir(false) }}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors ${
                mostrarGenerador
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
              Generar emails IA · {sinEmailGenerado}
            </button>
          )}

          {/* Enviar campaña */}
          {tieneContactos && !enProceso && contactos.some((c) => c.email_generado && c.estado === 'pendiente') && (
            <div className="inline-flex items-center rounded-md border border-gray-200 overflow-hidden">
              {/* Toggle test/real */}
              <button
                onClick={() => setModoEnvio((m) => m === 'test' ? 'real' : 'test')}
                title={modoEnvio === 'test' ? 'Modo test: sin envío real. Click para activar envío real' : 'Modo real: enviará correos reales. Click para volver a test'}
                className={`px-2 py-2 text-xs font-medium border-r border-gray-200 transition-colors ${
                  modoEnvio === 'real'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-50 text-gray-400 hover:text-gray-600'
                }`}
              >
                {modoEnvio === 'real' ? '● Real' : '○ Test'}
              </button>
              <button
                onClick={enviarCampana}
                className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 transition-colors ${
                  modoEnvio === 'real'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Enviar · {contactos.filter((c) => c.email_generado && c.estado === 'pendiente').length}
              </button>
            </div>
          )}

          {/* Crear seguimientos para contactos enviados */}
          {tieneContactos && !enProceso && contactos.some((c) => c.estado === 'enviado' || c.estado === 'abierto') && (
            <button
              onClick={crearSeguimientos}
              disabled={creandoSeguimientos}
              title="Crea los seguimientos programados para contactos ya enviados que no los tienen"
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-40 transition-colors"
            >
              {creandoSeguimientos ? (
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              )}
              Seguimientos
            </button>
          )}

          {/* Añadir dominios (cuando ya hay contactos) */}
          {tieneContactos && !enProceso && (
            <button
              onClick={() => { setMostrarAnadir((v) => !v); setMostrarGenerador(false) }}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border transition-colors ${
                mostrarAnadir
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'text-gray-500 hover:text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              + Añadir dominios
            </button>
          )}

          {/* Buscar (cuando no hay contactos) */}
          {!tieneContactos && !enProceso && (
            <button
              onClick={() => buscarContactos(dominiosParsed)}
              disabled={dominiosParsed.length === 0}
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              Buscar contactos
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Campaña', value: campana.nombre },
            { label: 'Dominios buscados', value: dominiosParsed.length || '—' },
            { label: 'Contactos', value: contactos.length },
            { label: 'Sin resultados', value: stats.sinResultados || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Panel búsqueda — primera vez */}
        {!tieneContactos && !enProceso && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(['dominios', 'sector'] as const).map((modo) => (
                <button
                  key={modo}
                  onClick={() => setModoBusqueda(modo)}
                  className={`flex-1 py-3 text-xs font-medium transition-colors ${
                    modoBusqueda === modo
                      ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {modo === 'dominios' ? 'Por dominio' : 'Por sector con IA'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Cuántos contactos traer — único ajuste previo a buscar */}
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <label className="text-xs font-medium text-gray-500 shrink-0">
                  Contactos por empresa
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 3, 5, 10, 20].map((n) => (
                    <button
                      key={n}
                      onClick={() => { setMaxPorDominio(n); setMaxPorDominioInput(String(n)) }}
                      className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                        maxPorDominio === n
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxPorDominioInput}
                    onChange={(e) => {
                      setMaxPorDominioInput(e.target.value)
                      const n = parseInt(e.target.value)
                      if (!isNaN(n) && n >= 1 && n <= 50) setMaxPorDominio(n)
                    }}
                    placeholder="otro"
                    title="Número personalizado (máx. 50)"
                    className={`w-14 text-center text-xs border rounded-md px-2 py-1 outline-none transition-colors ${
                      ![1,3,5,10,20].includes(maxPorDominio) && maxPorDominio > 0
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'text-gray-500 border-gray-200 focus:border-orange-400'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-gray-400">{maxPorDominio} por empresa · máx. 50</p>
              </div>

              {modoBusqueda === 'dominios' ? (
                <>
                  <p className="text-xs text-gray-400 mb-3">Pega los dominios a prospectar. Uno por línea, comas o URLs completas.</p>
                  <textarea
                    value={dominiosTexto}
                    onChange={(e) => setDominiosTexto(e.target.value)}
                    placeholder={'stripe.com\nshopify.com\nvercel.com'}
                    rows={6}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 font-mono outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all"
                  />
                  {dominiosParsed.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">{dominiosParsed.length} dominio{dominiosParsed.length !== 1 ? 's' : ''} detectado{dominiosParsed.length !== 1 ? 's' : ''}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-3">Claude genera una lista de empresas reales del sector. Luego Hunter busca sus contactos automáticamente.</p>
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Sector</label>
                      <input
                        value={sectorBusqueda}
                        onChange={(e) => setSectorBusqueda(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && buscarPorSector()}
                        placeholder="ej. Ecommerce, SaaS, Hostelería..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Región</label>
                      <input
                        value={regionBusqueda}
                        onChange={(e) => setRegionBusqueda(e.target.value)}
                        placeholder="ej. Asturias"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">País</label>
                      <input
                        value={paisBusqueda}
                        onChange={(e) => setPaisBusqueda(e.target.value)}
                        placeholder="España"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    onClick={buscarPorSector}
                    disabled={!sectorBusqueda.trim() || buscandoSector}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                  >
                    {buscandoSector ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Buscando empresas...
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        Generar empresas con IA
                      </>
                    )}
                  </button>

                  {/* Capa 3: Resultados sugeridos con checkboxes */}
                  {dominiosSugeridos.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-500">
                          {dominiosSugeridos.length} empresas sugeridas — selecciona las que quieres enriquecer
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDominiosSeleccionados(new Set(dominiosSugeridos))}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Todas
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => setDominiosSeleccionados(new Set())}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Ninguna
                          </button>
                          <span className="text-gray-200">|</span>
                          <button
                            onClick={() => { setDominiosSugeridos([]); setDominiosSeleccionados(new Set()) }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-1">
                          {dominiosSugeridos.map((d) => {
                            const sel = dominiosSeleccionados.has(d)
                            return (
                              <label
                                key={d}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${sel ? 'bg-orange-50' : 'hover:bg-gray-100'}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={sel}
                                  onChange={() => {
                                    setDominiosSeleccionados(prev => {
                                      const next = new Set(prev)
                                      if (sel) { next.delete(d) } else { next.add(d) }
                                      return next
                                    })
                                  }}
                                  className="accent-orange-500 shrink-0"
                                />
                                <span className={`text-xs font-mono truncate ${sel ? 'text-orange-700' : 'text-gray-500'}`}>{d}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-gray-400">
                          {dominiosSeleccionados.size} de {dominiosSugeridos.length} seleccionadas
                          {maxPorDominio > 0 && ` · ~${dominiosSeleccionados.size * maxPorDominio} contactos máx.`}
                        </p>
                        <button
                          onClick={() => buscarContactos(Array.from(dominiosSeleccionados))}
                          disabled={dominiosSeleccionados.size === 0}
                          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                        >
                          Buscar contactos →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Capa 2: Panel de filtrado pre-guardado */}
        {contactosPrevio.length > 0 && (
          <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-orange-100 bg-orange-50/40 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Hunter encontró {contactosPrevio.length} contactos
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Emails genéricos ya excluidos · filtra por cargo para quedarte con los más relevantes
                </p>
              </div>
              <button onClick={() => setContactosPrevio([])} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">

              {/* Filtro de perfiles con IA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">
                    ¿Qué perfiles quieres conservar?
                    <span className="text-gray-400 ml-1 font-normal">— vacío = guardar todos</span>
                  </label>
                  <button
                    onClick={sugerirPerfiles}
                    disabled={sugirendoPerfiles}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {sugirendoPerfiles
                      ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    }
                    Sugerir con IA
                  </button>
                </div>

                {/* Si no hay descripción guardada, mostrar campo inline */}
                {!(campana?.descripcion_agencia || descAgencia) && (
                  <div className="mb-2">
                    <input
                      value={descAgencia}
                      onChange={(e) => setDescAgencia(e.target.value)}
                      placeholder="Describe brevemente tu servicio para que la IA sugiera los perfiles ideales..."
                      className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-gray-700 placeholder:text-amber-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                  </div>
                )}

                {/* Chips sugeridos por IA — clickables para activar/desactivar */}
                {perfilesSugeridos.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-gray-400 mb-1.5">Sugeridos por IA — haz clic para activar:</p>
                    <div className="flex flex-wrap gap-1">
                      {perfilesSugeridos.map((p) => {
                        const activos = filtroCargo.split(',').map(x => x.trim()).filter(Boolean)
                        const activo = activos.some(a => a.toLowerCase() === p.toLowerCase())
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              const lista = filtroCargo.split(',').map(x => x.trim()).filter(Boolean)
                              if (activo) {
                                setFiltroCargo(lista.filter(x => x.toLowerCase() !== p.toLowerCase()).join(', '))
                              } else {
                                setFiltroCargo([...lista, p].join(', '))
                              }
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                              activo
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                            }`}
                          >
                            {activo && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            {p}
                          </button>
                        )
                      })}
                      <button onClick={() => setPerfilesSugeridos([])} className="text-[10px] text-gray-300 hover:text-gray-400 ml-1">
                        ocultar
                      </button>
                    </div>
                  </div>
                )}

                <input
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(e.target.value)}
                  placeholder="ej. CEO, Director de Marketing, CMO, Founder..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />

                {/* Chips de perfiles activos */}
                {filtroCargo.trim() && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {filtroCargo.split(',').map(p => p.trim()).filter(Boolean).map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-full text-[10px] font-medium">
                        {p}
                        <button
                          onClick={() => setFiltroCargo(prev => prev.split(',').map(x => x.trim()).filter(x => x !== p).join(', '))}
                          className="hover:text-orange-800 ml-0.5"
                        >×</button>
                      </span>
                    ))}
                    <button onClick={() => setFiltroCargo('')} className="text-[10px] text-gray-300 hover:text-gray-500">
                      limpiar
                    </button>
                  </div>
                )}
              </div>

              {/* Preview y acción */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                contactosFiltradosPrevio.length > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div>
                  <p className={`text-sm font-semibold ${contactosFiltradosPrevio.length > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {contactosFiltradosPrevio.length} contactos seleccionados
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {contactosExcluidosPrevio > 0
                      ? `${contactosExcluidosPrevio} excluidos por filtro de cargo`
                      : 'Sin filtro de cargo activo'}
                  </p>
                </div>
                <button
                  onClick={guardarContactosFiltrados}
                  disabled={contactosFiltradosPrevio.length === 0 || fase === 'buscando'}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                >
                  {fase === 'buscando' && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                  Guardar {contactosFiltradosPrevio.length} contactos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Historial de búsquedas */}
        {historialBusquedas.length > 0 && !tieneContactos && !enProceso && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setMostrarHistorial((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className="text-xs font-medium text-gray-600">Búsquedas anteriores</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{historialBusquedas.length}</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${mostrarHistorial ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {mostrarHistorial && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {historialBusquedas.map((h, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-mono truncate">
                          {h.dominios.slice(0, 3).join(', ')}{h.dominios.length > 3 ? ` +${h.dominios.length - 3}` : ''}
                        </span>
                        {h.filtro_cargo && (
                          <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full">
                            {h.filtro_cargo.split(',')[0].trim()}{h.filtro_cargo.split(',').length > 1 ? ` +${h.filtro_cargo.split(',').length - 1}` : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(h.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        {' · '}{h.encontrados} encontrados · {h.guardados} guardados
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDominiosTexto(h.dominios.join('\n'))
                        if (h.filtro_cargo) setFiltroCargo(h.filtro_cargo)
                        setMostrarHistorial(false)
                      }}
                      className="text-[11px] text-orange-500 hover:text-orange-600 font-medium shrink-0"
                    >
                      Repetir →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Panel análisis de empresas */}
        {tieneContactos && contactos.some((c) => c.analisis_empresa) && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Análisis de empresas</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {contactos.filter((c) => c.analisis_empresa).length} de {contactos.length} analizadas · los emails se generan usando este análisis
                </p>
              </div>
              {contactos.some((c) => !c.analisis_empresa) && !enProceso && (
                <button
                  onClick={analizarContactos}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  Analizar {contactos.filter((c) => !c.analisis_empresa).length} restantes →
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {contactos.filter((c) => c.analisis_empresa).map((c) => (
                <div key={c.id} className="px-5 py-3 flex items-start gap-4">
                  <div className="w-32 shrink-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{c.empresa || c.dominio}</p>
                    {c.analisis_empresa?.tamano && (
                      <span className="inline-block mt-0.5 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {c.analisis_empresa.tamano}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    {c.analisis_empresa?.actividad && (
                      <p className="text-xs text-gray-600 leading-relaxed">{c.analisis_empresa.actividad}</p>
                    )}
                    {c.analisis_empresa?.dolor && (
                      <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded leading-relaxed">
                        <span className="font-medium">Punto de dolor:</span> {c.analisis_empresa.dolor}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Panel generar emails con IA */}
        {mostrarGenerador && tieneContactos && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Generar emails con IA</p>
                <p className="text-xs text-gray-400 mt-0.5">Claude redactará un email personalizado para cada uno de los {sinEmailGenerado} contactos sin email.</p>
              </div>
              <button onClick={() => setMostrarGenerador(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">

              {/* Plantilla loader */}
              {plantillas.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Cargar plantilla guardada</label>
                  <div className="flex flex-wrap gap-1.5">
                    {plantillas.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => cargarPlantilla(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 text-gray-600 hover:text-orange-600 rounded-md transition-colors"
                      >
                        {p.nombre}
                        {p.sector && <span className="text-gray-300">·</span>}
                        {p.sector && <span className="text-gray-400">{p.sector}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Sector objetivo</label>
                  {sectorObjetivo ? (
                    <div className="flex items-center gap-2 py-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 font-medium">
                        {sectorObjetivo}
                      </span>
                      <button
                        onClick={() => setSectorObjetivo('')}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        cambiar
                      </button>
                    </div>
                  ) : (
                    <input
                      value={sectorObjetivo}
                      onChange={(e) => setSectorObjetivo(e.target.value)}
                      placeholder="ej. Ecommerce, SaaS..."
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 transition-all"
                    />
                  )}
                </div>
                {/* P2-6 tono */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Tono del email</label>
                  <div className="flex gap-1">
                    {(['cercano', 'formal', 'millennial', 'tecnico'] as Tono[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTono(t)}
                        className={`flex-1 px-2 py-2 text-xs rounded-md border transition-colors capitalize ${
                          tono === t
                            ? 'bg-orange-50 border-orange-300 text-orange-600 font-medium'
                            : 'border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">¿Qué ofrece tu agencia?</label>
                <textarea
                  value={descAgencia}
                  onChange={(e) => setDescAgencia(e.target.value)}
                  placeholder="ej. Somos una agencia de marketing digital especializada en SEO y publicidad de pago para ecommerce..."
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all"
                />
              </div>

              {/* P2-4 días de seguimiento */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Seguimientos automáticos — {diasSeguimiento.length} programado{diasSeguimiento.length !== 1 ? 's' : ''}
                </label>
                <div className="flex items-center flex-wrap gap-2">
                  {diasSeguimiento.map((dia, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-gray-400">#{i + 1}</span>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={dia}
                        onChange={(e) => {
                          const v = parseInt(e.target.value) || 1
                          setDiasSeguimiento(prev => prev.map((d, j) => j === i ? v : d))
                        }}
                        className="w-10 text-center text-xs font-medium text-gray-700 bg-transparent outline-none"
                      />
                      <span className="text-xs text-gray-400">d</span>
                      {diasSeguimiento.length > 1 && (
                        <button
                          onClick={() => setDiasSeguimiento(prev => prev.filter((_, j) => j !== i))}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
                        >
                          <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {diasSeguimiento.length < 5 && (
                    <button
                      onClick={() => setDiasSeguimiento(prev => [...prev, (prev[prev.length - 1] || 7) + 7])}
                      className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-orange-500 border border-dashed border-gray-200 hover:border-orange-300 rounded-lg transition-colors"
                    >
                      + añadir
                    </button>
                  )}
                </div>
              </div>

              {/* P2-3 límite diario */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Límite diario</label>
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                    <input
                      type="number"
                      min={0}
                      max={500}
                      value={limiteDiario || ''}
                      onChange={(e) => setLimiteDiario(parseInt(e.target.value) || 0)}
                      placeholder="∞"
                      className="w-12 text-center text-xs font-medium text-gray-700 bg-transparent outline-none"
                    />
                    <span className="text-xs text-gray-400">emails/día</span>
                  </div>
                  <span className="text-xs text-gray-400">{limiteDiario === 0 ? 'Sin límite' : `Máx. ${limiteDiario} por día`}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={generarEmails}
                  disabled={!descAgencia.trim() || !sectorObjetivo.trim()}
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Generar {sinEmailGenerado} emails
                </button>
                <p className="text-xs text-gray-400">~{Math.ceil(sinEmailGenerado * 0.5 / 60)} min aprox.</p>
                {descAgencia.trim() && (
                  <button
                    onClick={guardarComoPlantilla}
                    disabled={guardandoPlantilla}
                    className="ml-auto text-xs text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                  >
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Guardar como plantilla
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Panel añadir dominios — cuando ya hay contactos */}
        {mostrarAnadir && tieneContactos && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1">Añadir más dominios</p>
            <p className="text-xs text-orange-600/70 mb-3">Los nuevos contactos se añadirán a los existentes. No se duplicarán emails ya guardados.</p>
            {/* Capa 1 también en añadir */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-orange-700 shrink-0">Contactos por empresa</span>
              {[1, 2, 3, 5, 0].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxPorDominio(n)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    maxPorDominio === n
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'text-orange-700 border-orange-200 bg-white hover:border-orange-400'
                  }`}
                >
                  {n === 0 ? 'Todos' : n}
                </button>
              ))}
            </div>
            <textarea
              value={dominiosNuevos}
              onChange={(e) => setDominiosNuevos(e.target.value)}
              placeholder={'nuevaempresa.com\notraempresa.es'}
              rows={4}
              className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 font-mono outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all"
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => buscarContactos(dominiosNuevosParsed)}
                disabled={dominiosNuevosParsed.length === 0 || enProceso}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                Buscar en {dominiosNuevosParsed.length > 0 ? `${dominiosNuevosParsed.length} dominio${dominiosNuevosParsed.length !== 1 ? 's' : ''}` : 'nuevos dominios'}
              </button>
              <button
                onClick={() => { setMostrarAnadir(false); setDominiosNuevos('') }}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Resumen */}
        {tieneContactos && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="text-gray-900 font-semibold">{contactos.length}</span> contactos
              {stats.sinResultados > 0 && <span className="ml-2 text-gray-400">· {stats.sinResultados} dominios sin resultados</span>}
            </p>
          </div>
        )}

        {/* Tabla */}
        {tieneContactos && (
          <TablaContactos
            contactos={contactos}
            onExcluir={['listo', 'completado'].includes(fase) ? excluirContacto : undefined}
          />
        )}
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
