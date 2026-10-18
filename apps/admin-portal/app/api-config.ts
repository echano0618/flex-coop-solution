/**
 * Centralized API configuration for Flex Coop Solution.
 * Dynamically resolves API base URL in development and live production.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000/api/v1';
    }
    // Direct Cloud Run and production deployments
    return 'https://flexcoop-api-607281616647.asia-southeast1.run.app/api/v1';
  }
  return 'https://flexcoop-api-607281616647.asia-southeast1.run.app/api/v1';
}
