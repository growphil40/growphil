import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

interface DecodedToken {
  userId: string;
  role: string;
  tenantId: string;
  tenantType: 'agency' | 'client';
}

/**
 * Route protection middleware to redirect unauthenticated sessions and enforce role-based layouts.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Read JWT from cookie named 'accessToken' OR Authorization header
  let token = request.cookies.get('accessToken')?.value || '';
  
  const authHeader = request.headers.get('authorization');
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  let user: DecodedToken | null = null;

  if (token) {
    try {
      const secretStr = process.env.JWT_ACCESS_SECRET;
      if (!secretStr) {
        console.error('[Middleware] JWT_ACCESS_SECRET is not configured.');
        user = null;
      } else {
        const secret = new TextEncoder().encode(secretStr);
        const { payload } = await jwtVerify(token, secret);
        user = {
          userId: payload.userId as string,
          role: payload.role as string,
          tenantId: payload.tenantId as string,
          tenantType: payload.tenantType as 'agency' | 'client',
        };
      }
    } catch (error) {
      // Token expired or invalid
      user = null;
    }
  }

  const isAuthenticated = !!user;
  const isProtectedRoute = pathname.startsWith('/agency') || pathname.startsWith('/client');
  const isRootRoute = pathname === '/';
  const isLoginRoute = pathname === '/login';

  // Rule 1: Unauthenticated user hits any protected route → redirect to /login
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Apply authenticated routing rules
  if (isAuthenticated && user) {
    const role = user.role;

    // Rule 2 & 4: agency_admin hitting /, /client/*, or /login → redirect to /agency/clients
    if (role === 'agency_admin') {
      if (isRootRoute || pathname.startsWith('/client') || isLoginRoute) {
        return NextResponse.redirect(new URL('/agency/dashboard', request.url));
      }

    }

    // Rule 3 & 5: client_owner hitting /, /agency/*, or /login → redirect to /client/leads
    if (role === 'client_owner') {
      if (isRootRoute || pathname.startsWith('/agency') || isLoginRoute) {
        return NextResponse.redirect(new URL('/client/leads', request.url));
      }
    }

    // Support super_admin if logged in
    if (role === 'super_admin') {
      if (isRootRoute || isLoginRoute) {
        return NextResponse.redirect(new URL('/client/leads', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|webhooks/).*)'],
};
