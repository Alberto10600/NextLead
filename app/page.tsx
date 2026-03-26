import Link from 'next/link'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'

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
          <nav className="flex items-center gap-4">
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
      </main>

      <footer className="border-t border-[#334155] px-6 py-8 mt-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            NextLead · Powered by Claude AI
          </p>
        </div>
      </footer>
    </div>
  )
}
