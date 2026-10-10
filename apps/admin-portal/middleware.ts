import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const cleanHost = host.split(':')[0].toLowerCase();

  // Pattern 1: <tenant>-flexcoop.tuntongtech.com (Production)
  // Pattern 2: <tenant>-flexcoop.localhost or <tenant>.localhost (Local development)
  let tenantSlug = 'bayani'; // Default demonstration tenant
  let isTenantSubdomain = false;

  const prodMatch = cleanHost.match(/^([a-z0-9_-]+)-flexcoop\.tuntongtech\.com$/i);
  const localMatch = cleanHost.match(/^([a-z0-9_-]+)(-flexcoop)?\.localhost$/i);

  if (prodMatch && prodMatch[1]) {
    tenantSlug = prodMatch[1];
    isTenantSubdomain = true;
  } else if (localMatch && localMatch[1]) {
    tenantSlug = localMatch[1];
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
