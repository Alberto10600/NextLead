'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',              label: 'Dashboard',    icon: '▦' },
  { href: '/dashboard/campanas',     label: 'Campañas',     icon: '◎' },
  { href: '/dashboard/seguimientos', label: 'Seguimientos', icon: '↺' },
  { href: '/dashboard/contactos',    label: 'Contactos',    icon: '◈' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-[#1e293b] border-r border-[#334155] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#334155]">
        <Link href="/dashboard" className="text-xl font-bold">
          <span className="text-blue-500">Next</span>
          <span className="text-slate-200">Lead</span>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200
                ${isActive
                  ? 'bg-blue-600/20 text-blue-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#334155]'
                }
              `}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#334155]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-slate-200 hover:bg-[#334155] transition-all duration-200"
        >
          <span>→</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
