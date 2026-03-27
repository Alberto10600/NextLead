'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

  const inputClass = "bg-[#070B14] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all duration-150 focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 w-full"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 tracking-wide">Tu nombre</label>
          <input
            placeholder="María"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 tracking-wide">Agencia</label>
          <input
            placeholder="Mi Agencia"
            value={form.agencia}
            onChange={(e) => setForm((p) => ({ ...p, agencia: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 tracking-wide">Email</label>
        <input
          type="email"
          placeholder="tu@agencia.com"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400 tracking-wide">Contraseña</label>
        <input
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          required
          className={inputClass}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-lg transition-all duration-150 text-sm shadow-lg shadow-indigo-600/20 mt-1"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Creando cuenta...
          </>
        ) : (
          'Crear cuenta gratis'
        )}
      </button>

      <p className="text-xs text-slate-600 text-center">
        Al registrarte aceptas nuestros términos de uso.
        Empiezas con 25 contactos gratis.
      </p>

      <p className="text-sm text-center text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
