import { NextRequest, NextResponse } from 'next/server';
import { Permission, UserRole } from '@/lib/permissions';

// Configuration des permissions par route
export const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  // Routes admin uniquement
  '/tableaudebord/utilisateur': [Permission.SEARCH_ALL_USERS, Permission.CREATE_USERS],
  '/tableaudebord/partenaires': [Permission.CREATE_PARTNERS, Permission.MODIFY_PARTNER_INFO],
  '/tableaudebord/gestion-utilisateurs': [Permission.MANAGE_ROLES_PERMISSIONS],
  '/tableaudebord/analytics': [Permission.GLOBAL_DASHBOARD, Permission.PARTNER_ACTIVITY_REPORTS],
  
  // Routes mixtes (admin + partner avec restrictions)
  '/tableaudebord/projet': [Permission.ACCESS_ALL_PROJECTS, Permission.VIEW_OWN_PROJECTS],
  '/tableaudebord/lesdossiers': [Permission.ACCESS_ALL_FILES, Permission.CONSULT_OWN_DOCUMENTS],
  '/tableaudebord/incidents': [Permission.VIEW_ALL_INCIDENTS, Permission.REPORT_INCIDENTS_OWN_PROJECTS],
  '/tableaudebord/messages': [Permission.HANDLE_ALL_INCIDENTS, Permission.SEND_MESSAGES_TO_ADMINS],
  '/tableaudebord/recherche': [Permission.COMPLETE_ACTION_HISTORY, Permission.SEARCH_OWN_PROJECTS_ONLY],
  
  // Routes partner uniquement
  '/tableaudebord/mon-espace': [Permission.VIEW_OWN_PROJECTS, Permission.VIEW_OWN_ACTIVITY_STATS],
  '/tableaudebord/support': [Permission.REQUEST_TECHNICAL_SUPPORT],
  
  // Routes communes
  '/tableaudebord/profil': [Permission.VIEW_OWN_PERSONAL_INFO],
};

// Routes qui nécessitent d'être admin
export const ADMIN_ONLY_ROUTES = [
  '/tableaudebord/utilisateur',
  '/tableaudebord/partenaires',
  '/tableaudebord/gestion-utilisateurs',
  '/tableaudebord/analytics'
];

// Routes qui nécessitent d'être partenaire
export const PARTNER_ONLY_ROUTES = [
  '/tableaudebord/mon-espace'
];

// Interface pour les données utilisateur dans le middleware
interface MiddlewareUser {
  id: number;
  role_id: UserRole;
  partner_id?: number;
  is_active: boolean;
}

// Fonction pour vérifier les permissions d'une route
export function checkRoutePermissions(
  pathname: string, 
  user: MiddlewareUser | null
): { allowed: boolean; reason?: string } {
  // Si pas d'utilisateur, refuser l'accès
  if (!user) {
    return { allowed: false, reason: 'User not authenticated' };
  }

  // Si utilisateur inactif, refuser l'accès
  if (!user.is_active) {
    return { allowed: false, reason: 'User account is inactive' };
  }

  // Vérifier les routes admin uniquement
  if (ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    if (user.role_id !== UserRole.ADMIN) {
      return { allowed: false, reason: 'Admin role required' };
    }
  }

  // Vérifier les routes partenaire uniquement
  if (PARTNER_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    if (user.role_id !== UserRole.PARTNER) {
      return { allowed: false, reason: 'Partner role required' };
    }
  }

  // Vérifications spécifiques par route
  const routePermissions = ROUTE_PERMISSIONS[pathname];
  if (routePermissions) {
    // Pour les admins, toujours autoriser
    if (user.role_id === UserRole.ADMIN) {
      return { allowed: true };
    }

    // Pour les partenaires, vérifier les permissions spécifiques
    if (user.role_id === UserRole.PARTNER) {
      // Vérifier si au moins une permission partner est présente
      const partnerPermissions = [
        Permission.VIEW_OWN_PROJECTS,
        Permission.CONSULT_OWN_DOCUMENTS,
        Permission.REPORT_INCIDENTS_OWN_PROJECTS,
        Permission.SEND_MESSAGES_TO_ADMINS,
        Permission.SEARCH_OWN_PROJECTS_ONLY,
        Permission.VIEW_OWN_ACTIVITY_STATS,
        Permission.REQUEST_TECHNICAL_SUPPORT,
        Permission.VIEW_OWN_PERSONAL_INFO
      ];

      const hasPartnerPermission = routePermissions.some(perm => 
        partnerPermissions.includes(perm)
      );

      if (!hasPartnerPermission) {
        return { allowed: false, reason: 'Insufficient permissions for partner role' };
      }
    }
  }

  return { allowed: true };
}

// Fonction pour obtenir l'URL de redirection selon le rôle
export function getRedirectUrl(user: MiddlewareUser | null, originalUrl: string): string {
  if (!user) {
    return `/connexion?redirect=${encodeURIComponent(originalUrl)}`;
  }

  // Redirection selon le rôle après refus d'accès
  switch (user.role_id) {
    case UserRole.ADMIN:
      return '/tableaudebord';
    case UserRole.PARTNER:
      return '/tableaudebord/mon-espace';
    default:
      return '/tableaudebord';
  }
}

// Fonction pour valider un token JWT côté middleware (simplifié)
export function validateToken(token: string): MiddlewareUser | null {
  try {
    // En production, vous devriez utiliser une vraie validation JWT
    // Pour l'instant, simulation avec décodage base64
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return {
      id: payload.id,
      role_id: payload.role_id,
      partner_id: payload.partner_id,
      is_active: payload.is_active !== false
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

// Middleware principal pour les permissions
export function permissionsMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Ignorer les routes publiques
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/' ||
    pathname === '/connexion' ||
    pathname === '/mot-de-passe-oublie' ||
    pathname.includes('.') // Fichiers statiques
  ) {
    return NextResponse.next();
  }

  // Récupérer le token d'authentification
  const authToken = request.cookies.get('authToken')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');

  // Valider le token et obtenir les données utilisateur
  const user = authToken ? validateToken(authToken) : null;

  // Vérifier les permissions
  const permissionCheck = checkRoutePermissions(pathname, user);

  if (!permissionCheck.allowed) {
    console.log(`Access denied for ${pathname}: ${permissionCheck.reason}`);
    
    // Redirection vers la page appropriée
    const redirectUrl = getRedirectUrl(user, pathname);
    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    
    // Ajouter des headers pour le debugging
    if (process.env.NODE_ENV === 'development') {
      response.headers.set('X-Permission-Denied-Reason', permissionCheck.reason || 'Unknown');
      response.headers.set('X-User-Role', user?.role_id?.toString() || 'None');
    }
    
    return response;
  }

  // Ajouter les informations utilisateur aux headers pour les composants
  const response = NextResponse.next();
  if (user) {
    response.headers.set('X-User-Id', user.id.toString());
    response.headers.set('X-User-Role', user.role_id.toString());
    if (user.partner_id) {
      response.headers.set('X-Partner-Id', user.partner_id.toString());
    }
  }

  return response;
}

// Configuration des routes à protéger
export const config = {
  matcher: [
    /*
     * Protéger toutes les routes sauf :
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Routes publiques
     */
    '/((?!api|_next/static|_next/image|favicon.ico|connexion|mot-de-passe-oublie|$).*)',
  ],
};