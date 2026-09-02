import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SESSION_COOKIE = "db_admin_session"

const PUBLIC_PATHS = ["/login"]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path)
}

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const secret = process.env.SESSION_SECRET

  if (!token || !secret || secret.length < 32) {
    return false
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next()
  }

  const authenticated = await hasValidSession(request)

  if (isPublicPath(pathname)) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|site.webmanifest|images/).*)",
  ],
}
