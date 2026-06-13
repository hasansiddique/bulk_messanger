import { Capacitor } from '@capacitor/core';

function normalizeApiBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, '');

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Railway and most hosted APIs require HTTPS
  return `https://${trimmed}`;
}

/**
 * Resolves the API base URL for the mobile app.
 *
 * - When VITE_API_URL is set (Railway, LAN IP, etc.), use it everywhere.
 * - Otherwise, in Vite dev (http://localhost:4300), use same origin + proxy to local API.
 * - On native Capacitor (capacitor://), fall back to platform defaults.
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (configured) {
    return normalizeApiBaseUrl(configured);
  }

  if (typeof window !== 'undefined') {
    const { protocol, origin } = window.location;

    if (protocol === 'http:' || protocol === 'https:') {
      return origin;
    }
  }

  if (Capacitor.getPlatform() === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}
