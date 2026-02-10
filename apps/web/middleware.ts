import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register', '/join'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Get token from cookie or localStorage (via cookie for SSR)
  const token = request.cookies.get('resolv_access_token')?.value;

  // For client-side auth, we check localStorage
  // Middleware only handles basic redirects
  // Full auth check is done in AuthContext

  // Public routes - allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes without token cookie - let client handle
  // The dashboard layout will check AuthContext and redirect if needed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
