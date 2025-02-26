import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || ''
  const { pathname } = request.nextUrl

  // If there's no token and user is trying to access app, redirect to login
  if (!token && pathname.startsWith('/app')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // If there's a token and user is trying to access auth pages, redirect to app
  if (token && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/auth/:path*'],
}
