import Link from 'next/link'
import FormularioRegistro from '@/components/auth/FormularioRegistro'

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">
            <span className="text-blue-500">Next</span>
            <span className="text-slate-200">Lead</span>
          </Link>
          <h1 className="text-xl font-semibold text-slate-200 mt-6 mb-1">Crea tu cuenta gratis</h1>
          <p className="text-sm text-slate-400">25 contactos gratis · Sin tarjeta de crédito</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <FormularioRegistro />
        </div>
      </div>
    </div>
  )
}
