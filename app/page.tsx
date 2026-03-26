import Link from 'next/link'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Precios from '@/components/landing/Precios'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#334155] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-blue-500">Next</span>
            <span className="text-slate-200">Lead</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="#precios" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Precios
            </Link>
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
            >
              Empezar gratis
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <Hero />
        <Features />
        <Precios />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#334155] px-6 py-8 mt-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm text-slate-500">
            NextLead · Powered by Claude AI
          </p>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/precios" className="hover:text-slate-300 transition-colors">Precios</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
