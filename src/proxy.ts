import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SecurityMiddleware } from "./middleware/security-middleware-basic";

// Pages publiques qui ne nécessitent pas d'authentification
const PUBLIC_PATHS = [
  '/connexion',
  '/mot-de-passe-oublie',
  '/reset-mot-de-passe',
  '/changer-mot-de-passe-temporaire',
  '/api',
  '/_next',
  '/images',
  '/favicon.ico',
];

/**
 * Vérifie si le token JWT est valide et non expiré.
 */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;

    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  // Appliquer le middleware de sécurité en premier
  try {
    const securityResponse = await SecurityMiddleware.securityHandler(request);
    if (securityResponse) {
      return securityResponse;
    }
  } catch (error) {
    console.error('Erreur middleware sécurité:', error);
  }

  const { pathname } = request.nextUrl;

  // Laisser passer les routes publiques
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get('authToken')?.value ||
                    request.headers.get('authorization')?.replace('Bearer ', '');

  // Redirection de la racine selon l'état d'auth
  if (pathname === '/') {
    if (authToken && isTokenValid(authToken)) {
      return NextResponse.redirect(new URL('/tableaudebord', request.url));
    }
    return NextResponse.redirect(new URL('/connexion', request.url));
  }

  // Pas de token → redirect vers connexion
  if (!authToken) {
    const redirectUrl = new URL('/connexion', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Token expiré → redirect avec suppression des cookies
  if (!isTokenValid(authToken)) {
    const redirectUrl = new URL('/connexion', request.url);
    redirectUrl.searchParams.set('expired', 'true');
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('authToken');
    response.cookies.delete('userInfo');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
