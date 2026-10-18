/**
 * Multi-tenant cooperative isolation & identification utilities.
 * Ensures strict logical segregation between cooperatives (e.g. family-coop vs bayani-coop)
 * and resolves accurate cooperative names and identity markers across all portals.
 */

export interface TenantInfo {
  slug: string;
  name: string;
  isSubdomain: boolean;
  registrationNumber: string;
  logoLetter: string;
  tin?: string;
  coopType?: string;
}

export const KNOWN_COOPERATIVES: Record<string, { name: string; regNo: string; type?: string }> = {
  family: {
    name: 'Family Multi-Purpose Cooperative',
    regNo: 'CDA-NCR-2024-00892',
    type: 'Multi-Purpose',
  },
  bayani: {
    name: 'Bayani Multi-Purpose Cooperative',
    regNo: 'CDA-R4A-2023-00451',
    type: 'Multi-Purpose',
  },
  demo: {
    name: 'Demo Multi-Purpose Cooperative',
    regNo: 'CDA-NCR-2024-00100',
    type: 'Multi-Purpose',
  },
};

/**
 * Resolves the active cooperative tenant based on the subdomain hostname,
 * URL query parameters (?coop= or ?tenant=), and persistent registration registry.
 */
export function resolveTenantCoop(searchParams?: URLSearchParams | null): TenantInfo {
  if (typeof window === 'undefined') {
    return {
      slug: 'default',
      name: 'Cooperative Enterprise',
      isSubdomain: false,
      registrationNumber: 'CDA Registered',
      logoLetter: 'C',
      coopType: 'Multi-Purpose',
    };
  }

  const hostname = window.location.hostname.toLowerCase().split(':')[0];
  let slug = '';
  let isSubdomain = false;

  // 1. Check Subdomain Patterns
  const coopProdSuffix = '-coop.tuntongtech.com';
  const flexCoopProdSuffix = '-flexcoop.tuntongtech.com';
  const coopDevSuffix = '-coop.localhost';
  const flexCoopDevSuffix = '-flexcoop.localhost';

  if (hostname.endsWith(coopProdSuffix)) {
    slug = hostname.slice(0, -coopProdSuffix.length).trim();
    isSubdomain = true;
  } else if (hostname.endsWith(flexCoopProdSuffix)) {
    slug = hostname.slice(0, -flexCoopProdSuffix.length).trim();
    isSubdomain = true;
  } else if (hostname.endsWith(coopDevSuffix)) {
    slug = hostname.slice(0, -coopDevSuffix.length).trim();
    isSubdomain = true;
  } else if (hostname.endsWith(flexCoopDevSuffix)) {
    slug = hostname.slice(0, -flexCoopDevSuffix.length).trim();
    isSubdomain = true;
  } else if (hostname.endsWith('.localhost') && hostname !== 'localhost') {
    slug = hostname.slice(0, -'.localhost'.length).trim();
    isSubdomain = true;
  }

  // 2. Fallback to URL query parameter (?coop= or ?tenant=)
  if (!slug) {
    const params = searchParams || new URLSearchParams(window.location.search);
    slug = (params.get('coop') || params.get('tenant') || '').trim().toLowerCase();
  }

  // 3. Fallback to active admin session if visiting root path
  if (!slug) {
    try {
      const sess = localStorage.getItem('flexcoop_admin_session');
      if (sess) {
        const parsed = JSON.parse(sess);
        if (parsed.coopSlug) {
          slug = parsed.coopSlug;
        }
      }
    } catch {}
  }

  // 4. Resolve Details from Onboarding Registrations
  let resolvedName = '';
  let resolvedRegNo = '';
  let resolvedType = '';
  let resolvedTin = '';

  try {
    const regStr = localStorage.getItem('tuntong_coop_registrations');
    if (regStr) {
      const regs = JSON.parse(regStr);
      if (Array.isArray(regs)) {
        const match = slug
          ? regs.find((r: any) => r.slug?.toLowerCase() === slug.toLowerCase())
          : regs.find((r: any) => r.status === 'APPROVED') || regs[0];

        if (match) {
          if (!slug && match.slug) slug = match.slug.toLowerCase();
          resolvedName = match.name;
          resolvedRegNo = match.cdaRegistrationNumber || match.registrationNumber || '';
          resolvedType = match.coopType || '';
          resolvedTin = match.tin || '';
        }
      }
    }
  } catch {}

  // 5. Match against known cooperatives
  if (slug && KNOWN_COOPERATIVES[slug]) {
    const known = KNOWN_COOPERATIVES[slug];
    if (!resolvedName) resolvedName = known.name;
    if (!resolvedRegNo) resolvedRegNo = known.regNo;
    if (!resolvedType && known.type) resolvedType = known.type;
  }

  // 6. Natural Language Formatter if slug exists but no name registered yet
  if (!resolvedName && slug && slug !== 'default') {
    const words = slug
      .split(/[-_]/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    resolvedName = `${words.join(' ')} Multi-Purpose Cooperative`;
  }

  const finalName = resolvedName || 'Cooperative Enterprise';
  const logoLetter = finalName.trim().charAt(0).toUpperCase() || 'C';

  return {
    slug: slug || 'default',
    name: finalName,
    isSubdomain,
    registrationNumber: resolvedRegNo || 'CDA Registered',
    logoLetter,
    tin: resolvedTin,
    coopType: resolvedType || 'Multi-Purpose',
  };
}

/**
 * Tenant-Scoped Member Session Storage
 * Guarantees that member credentials and profile data are never leaked across coops.
 */
export function getTenantMemberSession(expectedSlug?: string): any | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Try tenant-scoped key
    if (expectedSlug && expectedSlug !== 'default') {
      const scoped = localStorage.getItem(`flexcoop_auth_member_${expectedSlug}`);
      if (scoped) {
        const parsed = JSON.parse(scoped);
        return parsed;
      }
    }

    // 2. Fallback to generic key with tenant verification
    const raw = localStorage.getItem('flexcoop_auth_member');
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (expectedSlug && expectedSlug !== 'default') {
      if (parsed.coopSlug && parsed.coopSlug.toLowerCase() !== expectedSlug.toLowerCase()) {
        // Mismatch: Member belongs to a different coop!
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setTenantMemberSession(member: any, slug: string, coopName?: string) {
  if (typeof window === 'undefined') return;
  const enriched = {
    ...member,
    coopSlug: slug,
    coopName: coopName || member.coopName,
  };
  const str = JSON.stringify(enriched);
  localStorage.setItem('flexcoop_auth_member', str);
  if (slug && slug !== 'default') {
    localStorage.setItem(`flexcoop_auth_member_${slug}`, str);
  }
  document.cookie = `flexcoop_auth_member=${encodeURIComponent(enriched.token || enriched.email || enriched.id)}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearTenantMemberSession(slug?: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('flexcoop_auth_member');
  if (slug && slug !== 'default') {
    localStorage.removeItem(`flexcoop_auth_member_${slug}`);
  }
  document.cookie = 'flexcoop_auth_member=; path=/; max-age=0';
}

/**
 * Tenant-Scoped Admin Session Storage
 */
export function getTenantAdminSession(expectedSlug?: string): any | null {
  if (typeof window === 'undefined') return null;

  try {
    if (expectedSlug && expectedSlug !== 'default') {
      const scoped = localStorage.getItem(`flexcoop_admin_session_${expectedSlug}`);
      if (scoped) {
        return JSON.parse(scoped);
      }
    }

    const raw = localStorage.getItem('flexcoop_admin_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    if (expectedSlug && expectedSlug !== 'default') {
      if (parsed.coopSlug && parsed.coopSlug.toLowerCase() !== expectedSlug.toLowerCase()) {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setTenantAdminSession(session: any, slug: string, coopName?: string) {
  if (typeof window === 'undefined') return;
  const enriched = {
    ...session,
    coopSlug: slug,
    coopName: coopName || session.coopName,
  };
  const str = JSON.stringify(enriched);
  localStorage.setItem('flexcoop_admin_session', str);
  if (slug && slug !== 'default') {
    localStorage.setItem(`flexcoop_admin_session_${slug}`, str);
  }
  document.cookie = `flexcoop_admin_session=${encodeURIComponent(enriched.token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearTenantAdminSession(slug?: string) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('flexcoop_admin_session');
  if (slug && slug !== 'default') {
    localStorage.removeItem(`flexcoop_admin_session_${slug}`);
  }
  document.cookie = 'flexcoop_admin_session=; path=/; max-age=0';
}
