import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const cleanHost = host.split(':')[0].toLowerCase();

  // Pattern 1: <tenant>-flexcoop.tuntongtech.com (Production)
  // Pattern 2: <tenant>-flexcoop.localhost or <tenant>.localhost (Local development)
  // Clean domain & suffix resolution
  let tenantSlug = 'bayani'; // Default demonstration tenant
  let isTenantSubdomain = false;

  const prodSuffix = '-flexcoop.tuntongtech.com';
  const devSuffix = '-flexcoop.localhost';

  if (cleanHost.endsWith(prodSuffix)) {
    tenantSlug = cleanHost.slice(0, -prodSuffix.length);
    isTenantSubdomain = true;
  } else if (cleanHost.endsWith(devSuffix)) {
    tenantSlug = cleanHost.slice(0, -devSuffix.length);
    isTenantSubdomain = true;
  } else if (cleanHost.endsWith('.localhost') && cleanHost !== 'localhost') {
    tenantSlug = cleanHost.slice(0, -'.localhost'.length);
    isTenantSubdomain = true;
  }

  // Clone the request headers and pass tenant context
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', tenantSlug);
  requestHeaders.set('x-tenant-domain', `${tenantSlug}-flexcoop.tuntongtech.com`);
  requestHeaders.set('x-is-tenant-subdomain', isTenantSubdomain ? 'true' : 'false');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
