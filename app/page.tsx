import Link from 'next/link'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 sticky top-0 z-50 backdrop-blur-sm bg-gray-50/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">Next</span>
            <span className="text-gray-900">Lead</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-150">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
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

      <footer className="border-t border-gray-200 px-6 py-8 mt-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm text-gray-400">
            NextLead · Powered by Claude AI
          </p>
        </div>
      </footer>
    </div>
  )
}
