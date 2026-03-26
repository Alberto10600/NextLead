'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

const CARGOS_DISPONIBLES = [
  'CEO', 'Founder', 'Director de Marketing', 'CMO',
  'Director Comercial', 'Responsable de Ventas', 'Head of Growth',
]

export default function EditarCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null)

  const [form, setForm] = useState({
    nombre: '',
    sector: '',
    pais: 'España',
    descripcion_agencia: '',
    cargos_objetivo: [] as string[],
    dominios_texto: '',
  })

  useEffect(() => {
    fetch(`/api/campanas/${id}`)
      .then((r) => r.json())
      .then(({ campana }) => {
        if (campana) {
          setForm({
            nombre: campana.nombre || '',
            sector: campana.sector || '',
            pais: campana.pais || 'España',
            descripcion_agencia: campana.descripcion_agencia || '',
            cargos_objetivo: campana.cargos_objetivo || [],
            dominios_texto: (campana.dominios || []).join('\n'),
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const parsearDominios = (texto: string): string[] => {
    return texto
      .split(/[\n,;]+/)
      .map((d) => d.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, ''))
      .filter((d) => d.length > 0 && d.includes('.'))
  }

  const toggleCargo = (cargo: string) => {
    setForm((prev) => ({
      ...prev,
      cargos_objetivo: prev.cargos_objetivo.includes(cargo)
        ? prev.cargos_objetivo.filter((c) => c !== cargo)
        : [...prev.cargos_objetivo, cargo],
    }))
  }

  const handleGuardar = async () => {
    const dominios = parsearDominios(form.dominios_texto)
    if (dominios.length === 0) {
      setToast({ msg: 'Introduce al menos un dominio', tipo: 'error' })
      return
    }

    setGuardando(true)
    try {
      const res = await fetch(`/api/campanas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          sector: form.sector,
          pais: form.pais,
          descripcion_agencia: form.descripcion_agencia,
          cargos_objetivo: form.cargos_objetivo,
          dominios,
        }),
      })

      if (!res.ok) throw new Error('Error al guardar')
      router.push(`/dashboard/campanas/${id}`)
    } catch {
      setToast({ msg: 'Error al guardar los cambios', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  }

  const dominiosParsados = parsearDominios(form.dominios_texto)

  return (
    <div>
      <div className="h-14 border-b border-[#334155] bg-[#1e293b] px-6 flex items-center gap-3">
        <Link href={`/dashboard/campanas/${id}`} className="text-slate-400 hover:text-slate-200 text-sm">
          ← Volver
        </Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-base font-semibold text-slate-200">Editar campaña</h1>
      </div>

      <div className="p-6 max-w-xl">
        <div className="space-y-5">
          <Input
            label="Nombre de la campaña"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          />

          <Input
            label="Sector objetivo"
            value={form.sector}
            onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">
              Dominios
              {dominiosParsados.length > 0 && (
                <span className="ml-2 text-blue-400">{dominiosParsados.length} detectados</span>
              )}
            </label>
            <textarea
              value={form.dominios_texto}
              onChange={(e) => setForm((p) => ({ ...p, dominios_texto: e.target.value }))}
              rows={6}
              className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 resize-none font-mono"
            />
            <p className="text-xs text-slate-600">Un dominio por línea</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Cargos objetivo</label>
            <div className="flex flex-wrap gap-2">
              {CARGOS_DISPONIBLES.map((cargo) => (
                <button
                  key={cargo}
                  type="button"
                  onClick={() => toggleCargo(cargo)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${form.cargos_objetivo.includes(cargo)
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#334155] text-slate-400 hover:text-slate-200'}`}
                >
                  {cargo}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">
              Descripción de la agencia
              <span className="ml-1 text-slate-600">({form.descripcion_agencia.length}/200)</span>
            </label>
            <textarea
              value={form.descripcion_agencia}
              onChange={(e) => setForm((p) => ({ ...p, descripcion_agencia: e.target.value.slice(0, 200) }))}
              rows={3}
              className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/campanas/${id}`} className="flex-1">
              <Button variant="secondary" className="w-full">Cancelar</Button>
            </Link>
            <Button onClick={handleGuardar} loading={guardando} className="flex-1">
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
