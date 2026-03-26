import Link from 'next/link'
import FormularioLogin from '@/components/auth/FormularioLogin'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-blue-500">Next</span>
            <span className="text-slate-200">Lead</span>
          </Link>
          <h1 className="text-xl font-semibold text-slate-200 mt-6 mb-1">Bienvenido de nuevo</h1>
          <p className="text-sm text-slate-400">Inicia sesión en tu cuenta</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <FormularioLogin />
        </div>
      </div>
    </div>
  )
}
