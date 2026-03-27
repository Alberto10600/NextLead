'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function FormularioCampana() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nombre, setNombre] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
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
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-1">Nueva campaña</h2>
        <p className="text-sm text-slate-500">
          Crea la campaña y añade los dominios que quieres prospectar con Hunter.
        </p>
      </div>

      <Input
        label="Nombre de la campaña"
        placeholder="Ej: Ecommerce España Q2 2025"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoFocus
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} disabled={!nombre.trim()} className="w-full">
        Crear campaña
      </Button>
    </form>
  )
}
