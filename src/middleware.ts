import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPaths = [
    '/connexion',
    '/mot-de-passe-oublie',
    '/api',
    '/_next',
    '/images',
    '/favicon.ico'
  ];

  // Vérifier si la route est publique
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Vérifier l'authentification pour les routes protégées
  const authToken = request.cookies.get('authToken')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');

  // Si pas de token et tentative d'accès à une route protégée
  if (!authToken && pathname.startsWith('/tableaudebord')) {
    const loginUrl = new URL('/connexion', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirection de la racine vers le tableau de bord si authentifié
  if (pathname === '/' && authToken) {
    const dashboardUrl = new URL('/tableaudebord', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirection de la racine vers connexion si pas authentifié
  if (pathname === '/' && !authToken) {
    const loginUrl = new URL('/connexion', request.url);
    return NextResponse.redirect(loginUrl);
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
