'use client'

import { useState, useEffect } from 'react'
import type { Plantilla, Tono } from '@/types'
import Button from '@/components/ui/Button'
import Toast from '@/components/ui/Toast'

const TONOS: { value: Tono; label: string; desc: string }[] = [
  { value: 'cercano',    label: 'Cercano',    desc: 'Directo, trato de tú' },
  { value: 'formal',    label: 'Formal',     desc: 'Profesional, usted' },
  { value: 'millennial', label: 'Millennial', desc: 'Informal, moderno' },
  { value: 'tecnico',   label: 'Técnico',    desc: 'Datos y métricas' },
]

const TONO_COLORS: Record<Tono, string> = {
  cercano:    'bg-blue-50 text-blue-600 border-blue-200',
  formal:     'bg-gray-100 text-gray-600 border-gray-200',
  millennial: 'bg-purple-50 text-purple-600 border-purple-200',
  tecnico:    'bg-emerald-50 text-emerald-600 border-emerald-200',
}

function PlantillaForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Plantilla>
  onSave: (data: Omit<Plantilla, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  onCancel: () => void
}) {
  const [nombre, setNombre] = useState(initial?.nombre || '')
  const [sector, setSector] = useState(initial?.sector || '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion || '')
  const [tono, setTono] = useState<Tono>(initial?.tono || 'cercano')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !descripcion.trim()) return
    setLoading(true)
    await onSave({ nombre: nombre.trim(), sector: sector.trim(), descripcion: descripcion.trim(), tono })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Nombre de la plantilla *</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej. Pitch para Ecommerce"
            autoFocus
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Sector (opcional)</label>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="ej. Ecommerce, SaaS..."
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Descripción de tu agencia / pitch *</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="ej. Somos una agencia especializada en SEO y SEM para tiendas online. Ayudamos a duplicar las ventas orgánicas en 6 meses con estrategias de contenido y técnicas de conversión..."
          rows={4}
          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{descripcion.length} caracteres</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Tono por defecto</label>
        <div className="flex gap-2">
          {TONOS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTono(t.value)}
              className={`flex-1 px-3 py-2 rounded-lg border text-xs transition-colors ${
                tono === t.value
                  ? 'bg-orange-50 border-orange-300 text-orange-600 font-medium'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
            >
              <div className="font-medium">{t.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} disabled={!nombre.trim() || !descripcion.trim()}>
          {initial?.id ? 'Guardar cambios' : 'Crear plantilla'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState<Plantilla | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null)

  const cargar = () => {
    fetch('/api/plantillas')
      .then(r => r.json())
      .then(d => setPlantillas(d.plantillas || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [])

  const crear = async (data: Omit<Plantilla, 'id' | 'user_id' | 'created_at'>) => {
    const res = await fetch('/api/plantillas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const d = await res.json()
      setPlantillas(prev => [d.plantilla, ...prev])
      setCreando(false)
      setToast({ msg: 'Plantilla creada', tipo: 'success' })
    }
  }

  const actualizar = async (data: Omit<Plantilla, 'id' | 'user_id' | 'created_at'>) => {
    if (!editando) return
    const res = await fetch(`/api/plantillas/${editando.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const d = await res.json()
      setPlantillas(prev => prev.map(p => p.id === editando.id ? d.plantilla : p))
      setEditando(null)
      setToast({ msg: 'Plantilla actualizada', tipo: 'success' })
    }
  }

  const eliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return
    const res = await fetch(`/api/plantillas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setPlantillas(prev => prev.filter(p => p.id !== id))
      setToast({ msg: 'Plantilla eliminada', tipo: 'success' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Plantillas de pitch</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Guarda distintas versiones de tu pitch por sector o caso de uso. Se cargan al generar emails.
          </p>
        </div>
        {!creando && (
          <Button onClick={() => { setCreando(true); setEditando(null) }} size="sm">
            + Nueva plantilla
          </Button>
        )}
      </div>

      {creando && (
        <PlantillaForm
          onSave={crear}
          onCancel={() => setCreando(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : plantillas.length === 0 && !creando ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-500 mb-1">No tienes plantillas guardadas</p>
          <p className="text-xs text-gray-400 mb-4">Crea tu primera plantilla para reutilizar tu pitch en campañas futuras</p>
          <Button onClick={() => setCreando(true)} size="sm">Crear primera plantilla</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {plantillas.map((p) => (
            <div key={p.id}>
              {editando?.id === p.id ? (
                <PlantillaForm
                  initial={p}
                  onSave={actualizar}
                  onCancel={() => setEditando(null)}
                />
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">{p.nombre}</h3>
                        {p.sector && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{p.sector}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${TONO_COLORS[p.tono]}`}>
                          {p.tono}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{p.descripcion}</p>
                      <p className="text-[10px] text-gray-300 mt-1.5">
                        {new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {' · '}{p.descripcion.length} caracteres
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => { setEditando(p); setCreando(false) }}
                        className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminar(p.id)}
                        className="px-2.5 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
