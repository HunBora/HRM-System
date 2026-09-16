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

  // Role-based route definitions
  const rolePermissions: Record<string, string[]> = {
    'ADMIN': ['/dashboard'], // ADMIN can access everything under dashboard
    'HR_MANAGER': ['/dashboard', '/dashboard/employees', '/dashboard/attendance', '/dashboard/leave', '/dashboard/offboarding', '/dashboard/kpi', '/dashboard/documents', '/dashboard/exports', '/dashboard/about', '/dashboard/expenses'],
    'HR': ['/dashboard', '/dashboard/employees', '/dashboard/attendance', '/dashboard/leave', '/dashboard/offboarding', '/dashboard/kpi', '/dashboard/documents', '/dashboard/exports', '/dashboard/about', '/dashboard/expenses'], // Legacy HR
    'PAYROLL_ADMIN': ['/dashboard', '/dashboard/payroll', '/dashboard/advance', '/dashboard/attendance', '/dashboard/exports', '/dashboard/about', '/dashboard/expenses'],
    'DEPT_HEAD': ['/dashboard', '/dashboard/attendance', '/dashboard/leave', '/dashboard/kpi', '/dashboard/about', '/dashboard/expenses'],
    'EMPLOYEE': ['/dashboard', '/dashboard/leave', '/dashboard/documents', '/dashboard/about', '/dashboard/expenses']
  };

  if (path.startsWith('/dashboard')) {
    const role = session?.role || 'EMPLOYEE';
    const allowedPrefixes = rolePermissions[role] || rolePermissions['EMPLOYEE'];
    
    // Check if the path matches the exact root allowed or starts with an allowed prefix + '/'
    const isAllowed = allowedPrefixes.some(prefix => 
      path === prefix || path.startsWith(`${prefix}/`)
    );

    if (!isAllowed && path !== '/dashboard') {
      // Redirect back to dashboard if trying to access unauthorized area
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
