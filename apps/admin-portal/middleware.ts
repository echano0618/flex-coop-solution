import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const cleanHost = host.split(':')[0].toLowerCase();

  // Pattern 1: <tenant>-coop.tuntongtech.com (Primary Production) or <tenant>-flexcoop.tuntongtech.com (Legacy Production)
  // Pattern 2: <tenant>-flexcoop.localhost, <tenant>-coop.localhost, or <tenant>.localhost (Local development)
  // Clean domain & suffix resolution
  let tenantSlug = 'bayani'; // Default demonstration tenant
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

  // Clone the request headers and pass tenant context
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', tenantSlug);
  requestHeaders.set('x-tenant-domain', `${tenantSlug}-coop.tuntongtech.com`);
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
