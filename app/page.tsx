import Link from 'next/link'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4 sticky top-0 z-50 backdrop-blur-sm bg-gray-50/90">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-md shadow-orange-400/30">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              Arr<span className="text-orange-500">ivo</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#como-funciona" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Cómo funciona</Link>
            <Link href="/precios" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Precios</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-orange-500/20"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <Hero />
        <Features />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <span className="text-sm font-bold text-gray-900">Arr<span className="text-orange-500">ivo</span></span>
              </div>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Prospección B2B automatizada. Encuentra contactos, genera emails con IA y gestiona seguimientos.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Producto</p>
                <ul className="space-y-2">
                  <li><Link href="/precios" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Precios</Link></li>
                  <li><Link href="/registro" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Registrarse</Link></li>
                  <li><Link href="/login" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Iniciar sesión</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">Legal</p>
                <ul className="space-y-2">
                  <li><Link href="/legal" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Privacidad y T&C</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Arrivo. Todos los derechos reservados.</p>
            <p className="text-xs text-gray-400">Powered by Claude AI · Hunter.io · Resend</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
