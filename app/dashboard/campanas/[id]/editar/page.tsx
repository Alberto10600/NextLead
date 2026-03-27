'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

export default function EditarCampanaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null)
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    fetch(`/api/campanas/${id}`)
      .then((r) => r.json())
      .then(({ campana }) => { if (campana) setNombre(campana.nombre || '') })
      .finally(() => setLoading(false))
  }, [id])

  const handleGuardar = async () => {
    if (!nombre.trim()) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/campanas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      router.push(`/dashboard/campanas/${id}`)
    } catch {
      setToast({ msg: 'Error al guardar los cambios', tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div>
      <div className="h-14 border-b border-white/[0.06] bg-[#0D1321] px-6 flex items-center gap-3">
        <Link href={`/dashboard/campanas/${id}`} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
          ← Volver
        </Link>
        <span className="text-slate-700">/</span>
        <h1 className="text-sm font-semibold text-slate-200">Editar campaña</h1>
      </div>

      <div className="p-6 max-w-md">
        <div className="space-y-5">
          <Input
            label="Nombre de la campaña"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />

          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/campanas/${id}`} className="flex-1">
              <Button variant="secondary" className="w-full">Cancelar</Button>
            </Link>
            <Button onClick={handleGuardar} loading={guardando} disabled={!nombre.trim()} className="flex-1">
              Guardar
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.tipo} onClose={() => setToast(null)} />}
    </div>
  )
}
