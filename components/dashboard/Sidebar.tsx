'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  {
    href: '/dashboard/plantillas',
    label: 'Plantillas',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/analytics',
    label: 'Análisis',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/pipeline',
    label: 'Pipeline',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="4" height="18" rx="1"/>
        <rect x="10" y="3" width="4" height="13" rx="1"/>
        <rect x="17" y="3" width="4" height="8" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/equipo',
    label: 'Equipo',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapse state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={`
        min-h-screen bg-white border-r border-gray-200 flex flex-col
        transition-all duration-200 ease-in-out shrink-0
        ${collapsed ? 'w-14' : 'w-56'}
      `}
    >
      {/* Logo + collapse toggle */}
      <div className="px-3 py-4 border-b border-gray-200 flex items-center justify-between gap-2">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/20 shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900 truncate">
              Arr<span className="text-orange-500">ivo</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-400/20">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          )}
        </button>
      </div>

      {/* Nav label */}
      {!collapsed && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Menu</p>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 px-2 space-y-0.5 ${collapsed ? 'pt-4' : 'pt-1'}`}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`
                group relative flex items-center gap-3 rounded-lg text-sm transition-all duration-150
                ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                ${isActive
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {isActive && !collapsed && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-500 rounded-l-full" />
              )}
              <span className={`flex-shrink-0 transition-colors duration-150 ${isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="tracking-tight">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`px-2 py-4 border-t border-gray-200 space-y-0.5`}>
        <Link
          href="/dashboard/perfil"
          title={collapsed ? 'Perfil' : undefined}
          className={`
            group flex items-center gap-3 rounded-lg text-sm transition-all duration-150
            ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
            ${pathname === '/dashboard/perfil'
              ? 'bg-orange-50 text-orange-600 font-medium'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          {!collapsed && <span className="tracking-tight">Perfil</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`
            group w-full flex items-center gap-3 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150
            ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
          `}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 transition-colors">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span className="tracking-tight">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
