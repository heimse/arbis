/**
 * NextAuth v5 Middleware
 * 
 * Защита страниц от неавторизованных пользователей
 */

import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthRoute = nextUrl.pathname.startsWith('/signin') || 
                      nextUrl.pathname.startsWith('/signup')
  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard')

  // Если пользователь авторизован и пытается зайти на страницы входа/регистрации
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // Если пользователь не авторизован и пытается зайти на защищенные страницы
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL('/signin', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

