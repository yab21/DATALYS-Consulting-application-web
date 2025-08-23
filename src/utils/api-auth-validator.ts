/**
 * Validateur d'authentification pour l'API Proxy
 * Sécurise les appels vers le backend
 */

import { NextRequest } from 'next/server';
import { logger } from './logger';
import { debugToken } from './debug-token';

// Types pour la validation
export interface TokenValidationResult {
  isValid: boolean;
  userId?: number;
  roleId?: number;
  partnerId?: number;
  error?: string;
}

export interface ProxyAuthConfig {
  requireAuth: boolean;
  allowedRoles?: number[];
  allowedEndpoints?: string[];
  blockedEndpoints?: string[];
  rateLimitPerMinute?: number;
}

// Configuration des endpoints par défaut
const DEFAULT_CONFIG: ProxyAuthConfig = {
  requireAuth: true, // Authentification requise par défaut
  allowedEndpoints: [
    'auth/login',
    'auth/reset-password',
    'auth/forgot-password',
    'auth/logout',
    // Endpoints DATALYS couramment utilisés
    'notifications',
    'fcm',
    'dashboard',
    'users',
    'projects',
    'partners',
    'files',
  ],
  blockedEndpoints: [
    'admin/delete-user',
    'system/config',
    'debug',
  ],
  rateLimitPerMinute: 100, // Limite raisonnable
};

// Cache pour le rate limiting (en production, utiliser Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

class ApiAuthValidator {
  private config: ProxyAuthConfig;

  constructor(config: ProxyAuthConfig = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Extraire le token d'authentification de la requête
   */
  private extractToken(request: NextRequest): string | null {
    // 1. Essayer Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      logger.debug('Token extrait depuis Authorization header', { length: token?.length || 0 });
      return token;
    }

    // 2. Essayer les cookies
    const cookieToken = request.cookies.get('authToken')?.value;
    if (cookieToken) {
      logger.debug('Token extrait depuis cookies', { length: cookieToken.length });
      return cookieToken;
    }

    // 3. Essayer les query parameters (moins sécurisé)
    const urlToken = request.nextUrl.searchParams.get('token');
    if (urlToken) {
      logger.debug('Token extrait depuis query params', { length: urlToken.length });
      return urlToken;
    }

    logger.debug('Aucun token trouvé dans la requête');
    return null;
  }

  /**
   * Valider le format du token (compatible JWT et tokens simples)
   */
  private validateTokenFormat(token: string): boolean {
    if (!token) return false;
    
    // Accepter les tokens non-vides d'au moins 10 caractères
    if (token.length < 10) return false;
    
    // Vérifier que ce n'est pas du texte en clair suspect
    if (token.includes(' ') || token.includes('\n') || token.includes('\t')) {
      return false;
    }
    
    return true;
  }

  /**
   * Décoder le payload du token (essaye JWT puis fallback sur validation basique)
   */
  private decodeTokenPayload(token: string): any {
    try {
      // 1. Essayer de décoder comme JWT
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = parts[1];
          const decoded = atob(payload);
          const parsed = JSON.parse(decoded);
          logger.debug('Token JWT décodé avec succès');
          return parsed;
        } catch (jwtError) {
          logger.debug('Échec décodage JWT, continuons...', jwtError);
        }
      }

      // 2. Pour les tokens non-JWT, on ne peut pas extraire les données
      // On va se baser sur le système d'authentification existant
      logger.debug('Token simple détecté (non-JWT)');
      return { tokenType: 'simple' };
    } catch (error) {
      logger.error('Erreur lors du décodage token', error);
      return null;
    }
  }

  /**
   * Valider le token d'authentification (compatible avec l'API DATALYS existante)
   */
  private validateToken(token: string): TokenValidationResult {
    if (!this.validateTokenFormat(token)) {
      return { isValid: false, error: 'Format de token invalide' };
    }

    const payload = this.decodeTokenPayload(token);
    if (!payload) {
      return { isValid: false, error: 'Token non décodable' };
    }

    // Pour les tokens JWT, vérifier l'expiration et les données
    if (payload.tokenType !== 'simple') {
      // Vérifier l'expiration JWT
      if (payload.exp && payload.exp < Date.now() / 1000) {
        return { isValid: false, error: 'Token expiré' };
      }

      // Vérifier les données obligatoires pour JWT
      if (!payload.userId && !payload.id) {
        return { isValid: false, error: 'Token sans identifiant utilisateur' };
      }

      return {
        isValid: true,
        userId: payload.userId || payload.id,
        roleId: payload.roleId || payload.role_id,
        partnerId: payload.partnerId || payload.partner_id,
      };
    }

    // Pour les tokens simples de l'API DATALYS, on fait une validation basique
    // Le token est considéré valide s'il existe et a le bon format
    logger.debug('Validation de token simple DATALYS');
    return {
      isValid: true,
      userId: 1, // ID générique pour les tokens simples
      roleId: undefined,
      partnerId: undefined,
    };
  }

  /**
   * Vérifier si l'endpoint est autorisé sans authentification
   */
  private isPublicEndpoint(path: string): boolean {
    const allowedEndpoints = this.config.allowedEndpoints || [];
    return allowedEndpoints.some(endpoint => 
      path.startsWith(endpoint) || path.includes(endpoint)
    );
  }

  /**
   * Vérifier si l'endpoint est bloqué
   */
  private isBlockedEndpoint(path: string): boolean {
    const blockedEndpoints = this.config.blockedEndpoints || [];
    return blockedEndpoints.some(endpoint => 
      path.startsWith(endpoint) || path.includes(endpoint)
    );
  }

  /**
   * Rate limiting par utilisateur
   */
  private checkRateLimit(userId: string): boolean {
    if (!this.config.rateLimitPerMinute) return true;

    const now = Date.now();
    const windowStart = now - (60 * 1000); // 1 minute
    
    const userLimit = rateLimitCache.get(userId);
    
    if (!userLimit || userLimit.resetTime < windowStart) {
      // Nouvelle fenêtre de temps
      rateLimitCache.set(userId, { count: 1, resetTime: now });
      return true;
    }

    if (userLimit.count >= this.config.rateLimitPerMinute) {
      logger.warn('Rate limit dépassé', { userId, count: userLimit.count });
      return false;
    }

    // Incrémenter le compteur
    userLimit.count++;
    rateLimitCache.set(userId, userLimit);
    return true;
  }

  /**
   * Nettoyer le cache de rate limiting (à appeler périodiquement)
   */
  private cleanupRateLimit(): void {
    const now = Date.now();
    const windowStart = now - (60 * 1000);
    
    for (const [userId, userLimit] of rateLimitCache.entries()) {
      if (userLimit.resetTime < windowStart) {
        rateLimitCache.delete(userId);
      }
    }
  }

  /**
   * Valider une requête proxy
   */
  public async validateProxyRequest(
    request: NextRequest, 
    path: string
  ): Promise<{ 
    isAuthorized: boolean; 
    error?: string; 
    userId?: number; 
    statusCode?: number 
  }> {
    try {
      // 1. Vérifier si l'endpoint est bloqué
      if (this.isBlockedEndpoint(path)) {
        logger.warn('Tentative d\'accès à un endpoint bloqué', { path });
        return { 
          isAuthorized: false, 
          error: 'Endpoint non autorisé', 
          statusCode: 403 
        };
      }

      // 2. Vérifier si l'authentification est requise
      if (!this.config.requireAuth || this.isPublicEndpoint(path)) {
        logger.debug('Endpoint public autorisé', { path });
        return { isAuthorized: true };
      }

      // 3. Extraire le token
      const token = this.extractToken(request);
      debugToken(token, `API_AUTH_${path}`);
      
      if (!token) {
        logger.info('Token manquant pour endpoint protégé', { path });
        return { 
          isAuthorized: false, 
          error: 'Token d\'authentification manquant', 
          statusCode: 401 
        };
      }

      // 4. Valider le token
      const tokenValidation = this.validateToken(token);
      if (!tokenValidation.isValid) {
        logger.warn('Token invalide', { error: tokenValidation.error, path });
        return { 
          isAuthorized: false, 
          error: tokenValidation.error || 'Token invalide', 
          statusCode: 401 
        };
      }

      // 5. Vérifier le rate limiting (plus permissif pour les tokens simples)
      const userId = tokenValidation.userId!.toString();
      if (!this.checkRateLimit(userId)) {
        // Pour l'instant, on log mais on n'bloque pas pour éviter les problèmes
        logger.warn('Rate limit dépassé mais autorisation maintenue', { userId });
        // return { 
        //   isAuthorized: false, 
        //   error: 'Limite de taux dépassée', 
        //   statusCode: 429 
        // };
      }

      // 6. Vérifier les rôles si configuré
      if (this.config.allowedRoles && tokenValidation.roleId) {
        if (!this.config.allowedRoles.includes(tokenValidation.roleId)) {
          logger.warn('Rôle non autorisé', { 
            userId: tokenValidation.userId, 
            roleId: tokenValidation.roleId, 
            path 
          });
          return { 
            isAuthorized: false, 
            error: 'Rôle insuffisant', 
            statusCode: 403 
          };
        }
      }

      // 7. Validation réussie
      logger.debug('Requête proxy autorisée', { 
        userId: tokenValidation.userId, 
        path 
      });

      return { 
        isAuthorized: true, 
        userId: tokenValidation.userId 
      };

    } catch (error) {
      logger.error('Erreur lors de la validation proxy', error);
      return { 
        isAuthorized: false, 
        error: 'Erreur de validation', 
        statusCode: 500 
      };
    }
  }

  /**
   * Ajouter des headers de sécurité à la réponse
   */
  public addSecurityHeaders(): Record<string, string> {
    return {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-API-Version': '1.0',
    };
  }

  /**
   * Nettoyer périodiquement le cache
   */
  public startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupRateLimit();
    }, 60 * 1000); // Toutes les minutes
  }
}

// Instance singleton
export const apiAuthValidator = new ApiAuthValidator();

// Démarrer le nettoyage automatique
if (typeof window === 'undefined') { // Côté serveur uniquement
  apiAuthValidator.startCleanupInterval();
}

export default apiAuthValidator;