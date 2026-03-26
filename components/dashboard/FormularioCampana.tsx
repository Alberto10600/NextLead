'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { FormularioCampana as TFormularioCampana } from '@/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const CARGOS_DISPONIBLES = [
  'CEO', 'Founder', 'Director de Marketing', 'CMO',
  'Director Comercial', 'Responsable de Ventas', 'Head of Growth',
]

const PAISES = ['España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú']

export default function FormularioCampana() {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<TFormularioCampana>({
    nombre: '',
    sector: '',
    pais: 'España',
    descripcion_agencia: '',
    cargos_objetivo: ['CEO', 'Director de Marketing'],
  })

  const toggleCargo = (cargo: string) => {
    setForm((prev) => ({
      ...prev,
      cargos_objetivo: prev.cargos_objetivo.includes(cargo)
        ? prev.cargos_objetivo.filter((c) => c !== cargo)
        : [...prev.cargos_objetivo, cargo],
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Crear campaña en Supabase
      const res = await fetch('/api/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear la campaña')
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
    <div className="max-w-xl mx-auto">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${paso >= n ? 'bg-blue-600 text-white' : 'bg-[#334155] text-slate-500'}`}
            >
              {n}
            </div>
            {n < 2 && <div className={`w-16 h-0.5 ${paso > n ? 'bg-blue-600' : 'bg-[#334155]'}`} />}
          </div>
        ))}
      </div>

      {paso === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-1">Define tu campaña</h2>
            <p className="text-sm text-slate-400">Cuéntanos a quién quieres llegar</p>
          </div>

          <Input
            label="Nombre de la campaña"
            placeholder="Ej: Ecommerce Q1 2025"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
          />

          <Input
            label="Sector objetivo"
            placeholder="Ej: tiendas de ecommerce en España"
            value={form.sector}
            onChange={(e) => setForm((p) => ({ ...p, sector: e.target.value }))}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">País</label>
            <select
              value={form.pais}
              onChange={(e) => setForm((p) => ({ ...p, pais: e.target.value }))}
              className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
            >
              {PAISES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
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
                      : 'bg-[#334155] text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {cargo}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setPaso(2)}
            disabled={!form.nombre || !form.sector || form.cargos_objetivo.length === 0}
            className="w-full"
          >
            Continuar →
          </Button>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-1">Tu agencia</h2>
            <p className="text-sm text-slate-400">Describe qué ofreces para personalizar los emails</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">
              Descripción de la agencia
              <span className="ml-1 text-slate-600">({form.descripcion_agencia.length}/200)</span>
            </label>
            <textarea
              placeholder="Ej: Somos una agencia especializada en SEO y publicidad de pago para ecommerce. Hemos ayudado a más de 50 tiendas online a triplicar sus ventas en 6 meses."
              value={form.descripcion_agencia}
              onChange={(e) => setForm((p) => ({ ...p, descripcion_agencia: e.target.value.slice(0, 200) }))}
              rows={4}
              className="bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Resumen */}
          <div className="bg-[#0f172a] border border-[#334155] rounded-md p-4 space-y-1">
            <p className="text-xs text-slate-400 font-medium mb-2">RESUMEN</p>
            <p className="text-xs text-slate-400">Campaña: <span className="text-slate-200">{form.nombre}</span></p>
            <p className="text-xs text-slate-400">Sector: <span className="text-slate-200">{form.sector}</span></p>
            <p className="text-xs text-slate-400">País: <span className="text-slate-200">{form.pais}</span></p>
            <p className="text-xs text-slate-400">Cargos: <span className="text-slate-200">{form.cargos_objetivo.join(', ')}</span></p>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPaso(1)} className="flex-1">
              ← Atrás
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!form.descripcion_agencia}
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
