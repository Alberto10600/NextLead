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
              px-3 py-2 rounded-lg text-xs font-medium text-left transition-all duration-150 border
              ${activo
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-slate-300 hover:border-white/20'}
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

const PASOS = ['Empresas objetivo', 'Contactos objetivo', 'Campaña']

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
      {/* Step indicator */}
      <div className="flex items-center mb-10">
        {PASOS.map((label, i) => {
          const num = i + 1
          const completed = paso > num
          const active = paso === num
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2.5 shrink-0">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-150
                    ${completed
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                      : active
                        ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
                        : 'bg-white/5 border border-white/10 text-slate-600'}
                  `}
                >
                  {completed ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block transition-all duration-150
                    ${active ? 'text-slate-200' : completed ? 'text-slate-500' : 'text-slate-600'}`}
                >
                  {label}
                </span>
              </div>
              {i < PASOS.length - 1 && (
                <div className="flex-1 mx-3">
                  <div
                    className={`h-px transition-all duration-150
                      ${paso > num ? 'bg-emerald-500/40' : 'bg-white/8'}`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─── PASO 1: Empresas objetivo ─── */}
      {paso === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-1">¿Qué empresas buscas?</h2>
            <p className="text-sm text-slate-500">Hunter buscará empresas que coincidan con estos filtros</p>
          </div>

          {/* Sector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Sector / Industria
            </label>
            <select
              value={form.sector}
              onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
              className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none
                focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-150
                [&>option]:bg-[#111827] [&>option]:text-slate-200"
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              País
            </label>
            <select
              value={form.pais}
              onChange={(e) => setForm((p) => ({ ...p, pais: e.target.value }))}
              className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none
                focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-150
                [&>option]:bg-[#111827] [&>option]:text-slate-200"
            >
              {PAISES_HUNTER.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Tamaño empresa */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tamaño de empresa
              <span className="ml-2 text-slate-600 normal-case font-normal">({form.tamanos.length} seleccionados)</span>
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
            <p className="text-sm text-slate-500">Filtra por departamento y nivel de seniority</p>
          </div>

          {/* Departamentos */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Departamento
              <span className="ml-2 text-slate-600 normal-case font-normal">({form.departamentos.length} seleccionados)</span>
            </label>
            <ChipMulti
              opciones={DEPARTAMENTOS}
              seleccionados={form.departamentos}
              onChange={(v) => setForm((p) => ({ ...p, departamentos: v }))}
            />
          </div>

          {/* Seniority */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Nivel / Seniority
              <span className="ml-2 text-slate-600 normal-case font-normal">({form.seniority.length} seleccionados)</span>
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
            <p className="text-sm text-slate-500">Nombre y descripción para personalizar los emails</p>
          </div>

          <Input
            label="Nombre de la campaña"
            placeholder="Ej: Ecommerce España Q2 2025"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Descripción de tu agencia
              <span className="ml-2 text-slate-600 normal-case font-normal">({form.descripcion_agencia.length}/200)</span>
            </label>
            <textarea
              placeholder="Ej: Somos una agencia de SEO y paid media especializada en ecommerce. Hemos triplicado ventas a más de 50 tiendas online."
              value={form.descripcion_agencia}
              onChange={(e) => setForm((p) => ({ ...p, descripcion_agencia: e.target.value.slice(0, 200) }))}
              rows={4}
              className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-slate-200
                placeholder:text-slate-600 outline-none transition-all duration-150
                focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500/40 resize-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Resumen de búsqueda</p>
            <div className="space-y-2">
              {[
                ['Sector', sectorFinal || '—'],
                ['País', PAISES_HUNTER.find(p => p.value === form.pais)?.label || form.pais],
                ['Tamaños', form.tamanos.length > 0 ? form.tamanos.join(', ') : '—'],
                ['Departamentos', `${form.departamentos.length} seleccionados`],
                ['Seniority', form.seniority.join(', ')],
              ].map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs text-slate-500 shrink-0">{key}</span>
                  <span className="text-xs text-slate-300 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">{error}</p>
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
