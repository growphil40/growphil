import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface DecodedToken {
  userId: string;
  role: string;
  tenantId: string;
  tenantType: 'agency' | 'client';
}

function decodeJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonPayload = atob(base64);
    const decoded = JSON.parse(jsonPayload);
    
    // Check if token is expired (with 10s buffer)
    if (decoded && decoded.exp && decoded.exp > Date.now() / 1000 + 10) {
      return {
        userId: decoded.userId || decoded.id || '',
        role: decoded.role || '',
        tenantId: decoded.tenantId || '',
        tenantType: decoded.tenantType || 'agency',
      };
    }
    return null;
  } catch {
    return null;
  }
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

  // Decode token or fallback to growphil_user cookie for active session
  let user = token ? decodeJwt(token) : null;

  if (!user) {
    const userCookie = request.cookies.get('growphil_user')?.value;
    if (userCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCookie));
        if (parsed && parsed.role) {
          user = {
            userId: parsed.id || '',
            role: parsed.role,
            tenantId: parsed.tenantId || '',
            tenantType: parsed.tenantType || 'client',
          };
        }
      } catch {}
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

    // Rule 2 & 4: agency_admin hitting /, /client/*, or /login → redirect to /agency/dashboard
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
