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

  // Role-based route definitions matching ResizableSidebar
  if (path.startsWith('/dashboard')) {
    const role = session?.role || 'EMPLOYEE';
    
    // ADMIN has full access to all dashboard routes
    if (role === 'ADMIN') {
      return NextResponse.next();
    }

    const rolePermissions: Record<string, string[]> = {
      'HR_MANAGER': [
        '/dashboard',
        '/dashboard/my-portal',
        '/dashboard/announcements',
        '/dashboard/employees',
        '/dashboard/recruitment',
        '/dashboard/offboarding',
        '/dashboard/resignation',
        '/dashboard/attendance',
        '/dashboard/biometric',
        '/dashboard/roster',
        '/dashboard/leave',
        '/dashboard/overtime',
        '/dashboard/loans',
        '/dashboard/exports',
        '/dashboard/kpi',
        '/dashboard/performance',
        '/dashboard/trainings',
        '/dashboard/disciplinary',
        '/dashboard/documents',
        '/dashboard/certificates',
        '/dashboard/assets',
        '/dashboard/expenses',
        '/dashboard/about',
      ],
      'HR': [
        '/dashboard',
        '/dashboard/my-portal',
        '/dashboard/announcements',
        '/dashboard/employees',
        '/dashboard/recruitment',
        '/dashboard/offboarding',
        '/dashboard/resignation',
        '/dashboard/attendance',
        '/dashboard/biometric',
        '/dashboard/roster',
        '/dashboard/leave',
        '/dashboard/overtime',
        '/dashboard/loans',
        '/dashboard/exports',
        '/dashboard/kpi',
        '/dashboard/performance',
        '/dashboard/trainings',
        '/dashboard/disciplinary',
        '/dashboard/documents',
        '/dashboard/certificates',
        '/dashboard/assets',
        '/dashboard/expenses',
        '/dashboard/about',
      ],
      'PAYROLL_ADMIN': [
        '/dashboard',
        '/dashboard/my-portal',
        '/dashboard/announcements',
        '/dashboard/attendance',
        '/dashboard/biometric',
        '/dashboard/roster',
        '/dashboard/overtime',
        '/dashboard/advance',
        '/dashboard/loans',
        '/dashboard/payroll',
        '/dashboard/exports',
        '/dashboard/expenses',
        '/dashboard/about',
      ],
      'DEPT_HEAD': [
        '/dashboard',
        '/dashboard/my-portal',
        '/dashboard/announcements',
        '/dashboard/attendance',
        '/dashboard/roster',
        '/dashboard/leave',
        '/dashboard/overtime',
        '/dashboard/kpi',
        '/dashboard/performance',
        '/dashboard/expenses',
        '/dashboard/about',
      ],
      'EMPLOYEE': [
        '/dashboard',
        '/dashboard/my-portal',
        '/dashboard/announcements',
        '/dashboard/roster',
        '/dashboard/leave',
        '/dashboard/overtime',
        '/dashboard/trainings',
        '/dashboard/documents',
        '/dashboard/certificates',
        '/dashboard/assets',
        '/dashboard/expenses',
        '/dashboard/about',
      ],
    };

    const allowedPrefixes = rolePermissions[role] || rolePermissions['EMPLOYEE'];
    
    // Check if path matches or starts with allowed prefix
    const isAllowed = allowedPrefixes.some(prefix => 
      path === prefix || path.startsWith(`${prefix}/`)
    );

    if (!isAllowed && path !== '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
