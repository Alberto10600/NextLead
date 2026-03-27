'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/campanas',
    label: 'Campañas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/contactos',
    label: 'Contactos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/seguimientos',
    label: 'Seguimientos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
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
    <aside className="w-56 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/20">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gray-900">
            Next<span className="text-orange-500">Lead</span>
          </span>
        </Link>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Menu</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${isActive
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-l-full" />
              )}
              <span className={`flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              <span className="tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 transition-colors">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="tracking-tight">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
