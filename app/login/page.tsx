import Link from 'next/link'
import FormularioLogin from '@/components/auth/FormularioLogin'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-orange-500/8 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          {/* Brand */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block text-2xl font-bold tracking-tight mb-6">
              Arr<span className="text-orange-500">ivo</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 mb-1.5">Bienvenido de nuevo</h1>
            <p className="text-sm text-gray-500">Inicia sesión en tu cuenta</p>
          </div>

          <FormularioLogin />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Sin cuenta?{' '}
          <Link href="/registro" className="text-orange-500 hover:text-orange-600 transition-colors">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
