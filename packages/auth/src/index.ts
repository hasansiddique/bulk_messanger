import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@bulk-messanger/database';

const authUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';
const webUrl = process.env.VITE_WEB_URL ?? 'http://localhost:4200';
const mobileUrl = process.env.VITE_MOBILE_URL ?? 'http://localhost:4300';

export const auth = betterAuth({
  baseURL: authUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    crossOriginCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  trustedOrigins: [
    authUrl,
    webUrl,
    mobileUrl,
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost',
  ],
});

export type Session = typeof auth.$Infer.Session;
