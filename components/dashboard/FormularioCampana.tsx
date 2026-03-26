'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import {
  SECTORES_HUNTER, PAISES_HUNTER, DEPARTAMENTOS_HUNTER,
  SENIORITY_HUNTER, TAMANOS_EMPRESA,
  type HunterDepartamento, type HunterSeniority, type HunterTamanoEmpresa,
} from '@/types'

interface FormState {
  nombre: string
  descripcion_agencia: string
  sector: string
  sector_custom: string
  pais: string
  tamanos: HunterTamanoEmpresa[]
  departamentos: HunterDepartamento[]
  seniority: HunterSeniority[]
}

const TAMANOS = Object.entries(TAMANOS_EMPRESA) as [HunterTamanoEmpresa, string][]
const DEPARTAMENTOS = Object.entries(DEPARTAMENTOS_HUNTER) as [HunterDepartamento, string][]
const SENIORIDADES = Object.entries(SENIORITY_HUNTER) as [HunterSeniority, string][]

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]
}

function ChipMulti<T extends string>({
  opciones, seleccionados, onChange, columns = 2,
}: {
  opciones: [T, string][]
  seleccionados: T[]
  onChange: (v: T[]) => void
  columns?: number
}) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {opciones.map(([value, label]) => {
        const activo = seleccionados.includes(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(toggleItem(seleccionados, value))}
            className={`
              px-3 py-2 rounded-md text-xs font-medium text-left transition-all duration-150 border
              ${activo
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-[#0f172a] border-[#334155] text-slate-400 hover:border-slate-500 hover:text-slate-300'}
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function FormularioCampana() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormState>({
    nombre: '',
    descripcion_agencia: '',
    sector: '',
    sector_custom: '',
    pais: 'ES',
    tamanos: ['11-50', '51-200', '201-500'],
    departamentos: ['executive', 'management', 'marketing', 'sales'],
    seniority: ['executive', 'senior'],
  })

  const sectorFinal = form.sector === '__custom__' ? form.sector_custom : form.sector

  const handleSubmit = async () => {
    if (!sectorFinal && !form.pais) {
      setError('Especifica al menos sector o país')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion_agencia: form.descripcion_agencia,
          filtros_hunter: {
            sector: sectorFinal,
            pais: form.pais,
            tamanos: form.tamanos,
            departamentos: form.departamentos,
            seniority: form.seniority,
          },
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Error al crear la campaña')
      }
      const { id } = await res.json()
      router.push(`/dashboard/campanas/${id}`)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {['Empresas objetivo', 'Contactos objetivo', 'Campaña'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${paso > i + 1 ? 'bg-green-600 text-white' :
                  paso === i + 1 ? 'bg-blue-600 text-white' : 'bg-[#334155] text-slate-500'}`}>
                {paso > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${paso === i + 1 ? 'text-slate-200' : 'text-slate-500'}`}>
                {label}
              </span>
            </div>
            {i < 2 && <div className={`w-8 h-0.5 ml-1 ${paso > i + 1 ? 'bg-green-600' : 'bg-[#334155]'}`} />}
          </div>
        ))}
      </div>

      {/* ─── PASO 1: Empresas objetivo ─── */}
      {paso === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-1">¿Qué empresas buscas?</h2>
            <p className="text-sm text-slate-400">Hunter buscará empresas que coincidan con estos filtros</p>
          </div>

          {/* Sector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">Sector / Industria</label>
            <select
              value={form.sector}
              onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
              className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="">-- Selecciona un sector --</option>
              {SECTORES_HUNTER.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
              <option value="__custom__">Otro (escribe el tuyo)</option>
            </select>
            {form.sector === '__custom__' && (
              <Input
                placeholder="Ej: Renewable Energy, Cybersecurity..."
                value={form.sector_custom}
                onChange={(e) => setForm((p) => ({ ...p, sector_custom: e.target.value }))}
              />
            )}
          </div>

          {/* País */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">País</label>
            <select
              value={form.pais}
              onChange={(e) => setForm((p) => ({ ...p, pais: e.target.value }))}
              className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
            >
              {PAISES_HUNTER.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Tamaño empresa */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Tamaño de empresa
              <span className="ml-2 text-slate-600 normal-case">({form.tamanos.length} seleccionados)</span>
            </label>
            <ChipMulti
              opciones={TAMANOS}
              seleccionados={form.tamanos}
              onChange={(v) => setForm((p) => ({ ...p, tamanos: v }))}
              columns={3}
            />
          </div>

          <Button
            onClick={() => setPaso(2)}
            disabled={!sectorFinal && !form.pais}
            className="w-full"
          >
            Continuar →
          </Button>
        </div>
      )}

      {/* ─── PASO 2: Contactos objetivo ─── */}
      {paso === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-1">¿A quién quieres llegar?</h2>
            <p className="text-sm text-slate-400">Filtra por departamento y nivel de seniority</p>
          </div>

          {/* Departamentos */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Departamento
              <span className="ml-2 text-slate-600 normal-case">({form.departamentos.length} seleccionados)</span>
            </label>
            <ChipMulti
              opciones={DEPARTAMENTOS}
              seleccionados={form.departamentos}
              onChange={(v) => setForm((p) => ({ ...p, departamentos: v }))}
            />
          </div>

          {/* Seniority */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              Nivel / Seniority
              <span className="ml-2 text-slate-600 normal-case">({form.seniority.length} seleccionados)</span>
            </label>
            <ChipMulti
              opciones={SENIORIDADES}
              seleccionados={form.seniority}
              onChange={(v) => setForm((p) => ({ ...p, seniority: v }))}
              columns={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPaso(1)} className="flex-1">← Atrás</Button>
            <Button
              onClick={() => setPaso(3)}
              disabled={form.departamentos.length === 0 || form.seniority.length === 0}
              className="flex-1"
            >
              Continuar →
            </Button>
          </div>
        </div>
      )}

      {/* ─── PASO 3: Datos de la campaña ─── */}
      {paso === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-1">Datos de la campaña</h2>
            <p className="text-sm text-slate-400">Nombre y descripción para personalizar los emails</p>
          </div>

          <Input
            label="Nombre de la campaña"
            placeholder="Ej: Ecommerce España Q2 2025"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">
              Descripción de tu agencia
              <span className="ml-1 text-slate-600">({form.descripcion_agencia.length}/200)</span>
            </label>
            <textarea
              placeholder="Ej: Somos una agencia de SEO y paid media especializada en ecommerce. Hemos triplicado ventas a más de 50 tiendas online."
              value={form.descripcion_agencia}
              onChange={(e) => setForm((p) => ({ ...p, descripcion_agencia: e.target.value.slice(0, 200) }))}
              rows={4}
              className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Resumen */}
          <div className="bg-[#0f172a] border border-[#334155] rounded-md p-4 space-y-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Resumen de búsqueda</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-slate-500">Sector</span>
              <span className="text-slate-300">{sectorFinal || '—'}</span>
              <span className="text-slate-500">País</span>
              <span className="text-slate-300">{PAISES_HUNTER.find(p => p.value === form.pais)?.label || form.pais}</span>
              <span className="text-slate-500">Tamaños</span>
              <span className="text-slate-300">{form.tamanos.length > 0 ? form.tamanos.join(', ') : '—'}</span>
              <span className="text-slate-500">Departamentos</span>
              <span className="text-slate-300">{form.departamentos.length} seleccionados</span>
              <span className="text-slate-500">Seniority</span>
              <span className="text-slate-300">{form.seniority.join(', ')}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPaso(2)} className="flex-1">← Atrás</Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!form.nombre || !form.descripcion_agencia}
              className="flex-1"
            >
              Crear campaña
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
