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
  isTest?: boolean;
}

/**
 * Distinguishes test cooperative instances (strictly bayani-coop / demo)
 * from production cooperative instances (family-coop and any newly registered coops).
 */
export function isTestCoopTenant(slug?: string): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase().trim();
  return s === 'bayani' || s === 'bayani-coop' || s === 'demo' || s === 'test';
}

/**
 * Purges legacy test/dummy data from localStorage for production tenants (e.g. family-coop).
 */
export function purgeTenantDummyRecords(slug: string) {
  if (typeof window === 'undefined' || !slug || isTestCoopTenant(slug)) return;

  const targetSlug = slug.toLowerCase().trim();

  // 1. Purge legacy dummy members from localStorage member list
  try {
    const storageKey = `flexcoop_members_${targetSlug}`;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const dummyNames = ['Maria Clara Santos', 'Juan Perez Dela Cruz'];
        const cleaned = parsed.filter(
          (m: any) =>
            !dummyNames.includes(m.name) &&
            m.id !== 'mem_1' &&
            m.id !== 'mem_2' &&
            m.id !== 'mem_maria_santos'
        );
        localStorage.setItem(storageKey, JSON.stringify(cleaned));
      }
    }
  } catch {}

  // 2. Remove any dummy test loans or fake transactions stored under this production tenant
  try {
    localStorage.removeItem(`flexcoop_loans_${targetSlug}`);
    localStorage.removeItem(`flexcoop_test_records_${targetSlug}`);
  } catch {}
}

/**
 * Normalizes cooperative slugs to ensure uniform keying across subdomains,
 * query parameters, and storage keys (e.g. 'family-coop' and 'family' both normalize to 'family-coop').
 */
export function normalizeCoopSlug(slug?: string): string {
  if (!slug) return 'family-coop';
  const s = slug.toLowerCase().trim();
  if (s === 'default' || !s) return 'family-coop';
  // Standardize on -coop format for tenant keys
  if (s === 'family' || s === 'family-coop') return 'family-coop';
  if (s === 'bayani' || s === 'bayani-coop') return 'bayani-coop';
  return s.endsWith('-coop') ? s : `${s}-coop`;
}

/**
 * Checks whether two cooperative slugs refer to the same cooperative.
 */
export function isCoopSlugMatch(slugA?: string, slugB?: string): boolean {
  if (!slugA || !slugB) return true;
  const a = normalizeCoopSlug(slugA);
  const b = normalizeCoopSlug(slugB);
  return a === b;
}

export const KNOWN_COOPERATIVES: Record<string, { name: string; regNo: string; type?: string; isTest?: boolean }> = {
  family: {
    name: 'Family Multi-Purpose Cooperative',
    regNo: 'CDA-NCR-2024-00892',
    type: 'Multi-Purpose',
    isTest: false, // Strictly Production Instance
  },
  'family-coop': {
    name: 'Family Multi-Purpose Cooperative',
    regNo: 'CDA-NCR-2024-00892',
    type: 'Multi-Purpose',
    isTest: false,
  },
  bayani: {
    name: 'Bayani Multi-Purpose Cooperative',
    regNo: 'CDA-R4A-2023-00451',
    type: 'Multi-Purpose',
    isTest: true, // Designated Test Instance
  },
  'bayani-coop': {
    name: 'Bayani Multi-Purpose Cooperative',
    regNo: 'CDA-R4A-2023-00451',
    type: 'Multi-Purpose',
    isTest: true,
  },
  demo: {
    name: 'Demo Multi-Purpose Cooperative',
    regNo: 'CDA-NCR-2024-00100',
    type: 'Multi-Purpose',
    isTest: true,
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
      isTest: false,
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
    isTest: isTestCoopTenant(slug),
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

export interface GeneralManagerInfo {
  name: string;
  email: string;
  address?: string;
  tin?: string;
  idNumber?: string;
  phone?: string;
}

/**
 * Resolves the officially registered General Manager for the cooperative.
 * Sources from coop-register records, active authenticated session, or tenant identity.
 */
export function resolveGeneralManager(targetSlug?: string): GeneralManagerInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'General Manager',
      email: 'gm@coop.tuntongtech.com',
      address: 'Philippines',
    };
  }

  const tenantInfo = resolveTenantCoop();
  const slug = targetSlug || tenantInfo.slug;

  // 1. Check registrations in localStorage (from coop-register or approved queue)
  try {
    const regStr = localStorage.getItem('tuntong_coop_registrations');
    if (regStr) {
      const regs = JSON.parse(regStr);
      if (Array.isArray(regs) && regs.length > 0) {
        const match =
          slug && slug !== 'default'
            ? regs.find((r: any) => r.slug?.toLowerCase() === slug.toLowerCase())
            : regs.find((r: any) => r.status === 'APPROVED') || regs[0];

        if (match) {
          const fullName =
            [match.adminFirstName, match.adminMiddleName, match.adminLastName]
              .filter(Boolean)
              .join(' ')
              .trim() || match.adminFullName;
          const email = match.adminEmail || match.contactEmail;
          if (fullName && email) {
            return {
              name: fullName,
              email: email,
              address: match.address || 'Philippines',
              tin: match.tin,
              idNumber: match.cdaRegistrationNumber,
              phone: match.contactPhone,
            };
          }
        }
      }
    }
  } catch {}

  // 2. Check active admin session if logged in
  try {
    const sess = getTenantAdminSession(slug);
    if (sess) {
      if (
        sess.role === 'GENERAL_MANAGER' ||
        sess.roleTitle?.toLowerCase().includes('general manager')
      ) {
        return {
          name: sess.name || 'General Manager',
          email: sess.email || `gm@${slug !== 'default' ? slug + '-coop.' : ''}tuntongtech.com`,
          address: 'Philippines',
        };
      }
    }
  } catch {}

  // 3. Known / fallback defaults
  const emailDomain =
    slug && slug !== 'default' ? `${slug}-coop.tuntongtech.com` : 'coop.tuntongtech.com';
  return {
    name: 'General Manager',
    email: `gm@${emailDomain}`,
    address: 'Philippines',
  };
}
