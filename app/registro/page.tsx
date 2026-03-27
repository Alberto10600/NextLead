import Link from 'next/link'
import FormularioRegistro from '@/components/auth/FormularioRegistro'

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
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
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Next</span>
              <span className="text-gray-900">Lead</span>
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 mb-1.5">Crea tu cuenta gratis</h1>
            <p className="text-sm text-gray-500">25 contactos gratis · Sin tarjeta de crédito</p>
          </div>

          <FormularioRegistro />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 transition-colors">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
