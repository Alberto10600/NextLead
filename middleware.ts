import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/login', '/registro', '/precios']
const AUTH_ROUTES = ['/login', '/registro']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Webhook de Stripe no requiere autenticación
  if (pathname === '/api/stripe/webhook') {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  const isProtectedRoute = pathname.startsWith('/dashboard')
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  // Sin sesión en ruta protegida → redirect /login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Con sesión en /login o /registro → redirect /dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
