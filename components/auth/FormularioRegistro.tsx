'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function FormularioRegistro() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    agencia: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nombre: form.nombre, agencia: form.agencia },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Actualizar perfil con nombre y agencia
    if (data.user) {
      await supabase
        .from('perfiles')
        .update({ nombre: form.nombre, agencia: form.agencia })
        .eq('id', data.user.id)
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Tu nombre"
          placeholder="María"
          value={form.nombre}
          onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
        />
        <Input
          label="Nombre de la agencia"
          placeholder="Mi Agencia"
          value={form.agencia}
          onChange={(e) => setForm((p) => ({ ...p, agencia: e.target.value }))}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="tu@agencia.com"
        value={form.email}
        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={form.password}
        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        required
      />

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Crear cuenta gratis
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Al registrarte aceptas nuestros términos de uso.
        Empiezas con 25 contactos gratis.
      </p>

      <p className="text-sm text-center text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
