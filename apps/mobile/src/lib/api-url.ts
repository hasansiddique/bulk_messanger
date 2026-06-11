import { Capacitor } from '@capacitor/core';

/**
 * Resolves the API base URL for the mobile app.
 *
 * - When loaded over http(s) (Vite dev / live reload), use same origin + proxy.
 * - On native Capacitor (capacitor://), call the host machine API directly.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { protocol, origin } = window.location;

    if (protocol === 'http:' || protocol === 'https:') {
      return origin;
    }
  }

  const configured = import.meta.env.VITE_API_URL;
  if (configured) {
    return configured;
  }

  if (Capacitor.getPlatform() === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}
