import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const cleanHost = host.split(':')[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  // 1. Bypass static assets, manifest, and API endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.png' ||
    pathname === '/manifest.json' ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  // 2. Multi-tenant Subdomain Resolution
  let tenantSlug = 'bayani';
  let isTenantSubdomain = false;

  const coopProdSuffix = '-coop.tuntongtech.com';
  const flexCoopProdSuffix = '-flexcoop.tuntongtech.com';
  const coopDevSuffix = '-coop.localhost';
  const flexCoopDevSuffix = '-flexcoop.localhost';

  if (cleanHost.endsWith(coopProdSuffix)) {
    tenantSlug = cleanHost.slice(0, -coopProdSuffix.length);
    isTenantSubdomain = true;
  } else if (cleanHost.endsWith(flexCoopProdSuffix)) {
    tenantSlug = cleanHost.slice(0, -flexCoopProdSuffix.length);
    isTenantSubdomain = true;
  } else if (cleanHost.endsWith(coopDevSuffix)) {
    tenantSlug = cleanHost.slice(0, -coopDevSuffix.length);
    isTenantSubdomain = true;
  } else if (cleanHost.endsWith(flexCoopDevSuffix)) {
    tenantSlug = cleanHost.slice(0, -flexCoopDevSuffix.length);
    isTenantSubdomain = true;
  } else if (cleanHost.endsWith('.localhost') && cleanHost !== 'localhost') {
    tenantSlug = cleanHost.slice(0, -'.localhost'.length);
    isTenantSubdomain = true;
  }

  // 3. Security Route Guards: Prevent unauthenticated access across all portals
  // A. OPERATOR PORTAL GUARD
  if (pathname.startsWith('/operator')) {
    const operatorCookie = request.cookies.get('tuntong_operator_session')?.value;
    if (pathname === '/operator/login') {
      if (operatorCookie) {
        return NextResponse.redirect(new URL('/operator', request.url));
      }
      // Allow unauthenticated access to operator login
    } else {
      if (!operatorCookie) {
        return NextResponse.redirect(new URL('/operator/login', request.url));
      }
    }
  }

  // B. MEMBER PORTAL GUARD (General Managers and Members)
  if (pathname.startsWith('/member')) {
    const memberCookie = request.cookies.get('flexcoop_auth_member')?.value;
    const adminCookie = request.cookies.get('flexcoop_admin_session')?.value;
    if (pathname === '/member/login' || pathname === '/member/register') {
      // Allow unauthenticated access to member login and PMES registration
    } else {
      if (!memberCookie && !adminCookie) {
        return NextResponse.redirect(new URL('/member/login', request.url));
      }
    }
  }

  // 4. Set Tenant Context Headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', tenantSlug);
  requestHeaders.set('x-tenant-domain', `${tenantSlug}-coop.tuntongtech.com`);
  requestHeaders.set('x-is-tenant-subdomain', isTenantSubdomain ? 'true' : 'false');

  // C. ROOT & ADMIN / STAFF PORTAL GUARD
  if (pathname === '/') {
    const hasCoopQuery = request.nextUrl.searchParams.has('coop') || request.nextUrl.searchParams.has('tenant');
    // If accessing root on non-tenant subdomain without ?coop= parameter, serve Landing Page
    if (!isTenantSubdomain && !hasCoopQuery) {
      return NextResponse.rewrite(new URL('/landing', request.url), {
        request: { headers: requestHeaders },
      });
    }

    // Require active staff admin session cookie to access the Admin Portal dashboard
    const adminCookie = request.cookies.get('flexcoop_admin_session')?.value;
    if (!adminCookie) {
      const loginUrl = new URL('/login', request.url);
      if (hasCoopQuery) {
        const coopVal = request.nextUrl.searchParams.get('coop') || request.nextUrl.searchParams.get('tenant');
        if (coopVal) loginUrl.searchParams.set('coop', coopVal);
      } else if (isTenantSubdomain && tenantSlug) {
        loginUrl.searchParams.set('coop', tenantSlug);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow uninhibited access to /login so staff can always authenticate or switch accounts

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
