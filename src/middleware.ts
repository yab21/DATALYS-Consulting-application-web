import { NextRequest, NextResponse } from 'next/server';

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/connexion',
  '/mot-de-passe-oublie',
  '/reset-mot-de-passe',
  '/changer-mot-de-passe-temporaire',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/') ||
    pathname.includes('.')
  );
}

/**
 * Vérifie si le token JWT est valide et non expiré.
 * Le token dans le cookie est le JWT brut (non chiffré).
 */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Décodage du payload (Edge Runtime : atob disponible)
    const payload = JSON.parse(atob(parts[1]));

    // Vérifier la présence du champ d'expiration
    if (!payload.exp) return false;

    // Vérifier si le token est expiré
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowInSeconds;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les assets statiques et la racine
  if (isStaticAsset(pathname) || pathname === '/') {
    return NextResponse.next();
  }

  // Laisser passer les routes publiques
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Pour toutes les autres routes (dashboard), vérifier le token
  const authToken = request.cookies.get('authToken')?.value;

  // Pas de token → redirect vers connexion
  if (!authToken) {
    const redirectUrl = new URL('/connexion', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Token présent mais expiré → redirect avec indication d'expiration
  if (!isTokenValid(authToken)) {
    const redirectUrl = new URL('/connexion', request.url);
    redirectUrl.searchParams.set('expired', 'true');

    const response = NextResponse.redirect(redirectUrl);

    // Supprimer les cookies d'auth expirés côté serveur
    response.cookies.delete('authToken');
    response.cookies.delete('userInfo');

    return response;
  }

  // Token valide → laisser passer
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protéger toutes les routes sauf :
     * - _next/static (fichiers statiques Next.js)
     * - _next/image (optimisation d'images)
     * - favicon.ico
     * - api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
