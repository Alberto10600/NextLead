import Link from 'next/link'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070B14]">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4 sticky top-0 z-50 backdrop-blur-sm bg-[#070B14]/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Next</span>
            <span className="text-slate-100">Lead</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-100 transition-colors duration-150">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
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

      <footer className="border-t border-white/[0.06] px-6 py-8 mt-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-slate-600">
            NextLead · Powered by Claude AI
          </p>
        </div>
      </footer>
    </div>
  )
}
