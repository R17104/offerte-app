import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/register', '/offerte']

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (isPublic) {
    const cookie = req.cookies.get('session')?.value
    const session = await decrypt(cookie)
    if (session?.userId && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      return NextResponse.redirect(new URL('/customers', req.url))
    }
    return NextResponse.next()
  }

  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
}
