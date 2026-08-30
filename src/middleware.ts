import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public routes
  if (path === '/login' || path.startsWith('/_next') || path.startsWith('/api') || path.startsWith('/public')) {
    return NextResponse.next();
  }

  // Redirect root to dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check session
  const cookie = request.cookies.get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;

  if (!session?.userId && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based restrictions
  if (session?.role === 'EMPLOYEE') {
    // Employees can only access specific routes
    const allowedPrefixes = ['/dashboard/leave', '/dashboard/payslip'];
    
    // Exact path allowed
    if (path === '/dashboard') return NextResponse.next();

    // Check if path starts with any allowed prefix
    const isAllowed = allowedPrefixes.some(prefix => path.startsWith(prefix));
    
    if (!isAllowed) {
      // Redirect back to dashboard if trying to access unauthorized area
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
