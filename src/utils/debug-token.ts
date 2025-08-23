/**
 * Debug helper pour analyser les tokens DATALYS
 */

import { logger } from './logger';

export function debugToken(token: string | null, context: string): void {
  if (!token) {
    logger.debug(`[${context}] Token absent`);
    return;
  }

  logger.debug(`[${context}] Token debug`, {
    length: token.length,
    startsWith: token.substring(0, 10),
    endsWiths: token.substring(token.length - 10),
    hasSpaces: token.includes(' '),
    hasDots: token.includes('.'),
    dotCount: (token.match(/\./g) || []).length,
    isJWT: token.split('.').length === 3,
  });

  // Essayer de décoder comme JWT
  if (token.split('.').length === 3) {
    try {
      const parts = token.split('.');
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      logger.debug(`[${context}] JWT décodé`, {
        header,
        payload: {
          ...payload,
          // Masquer les données sensibles
          userId: payload.userId || payload.id || 'N/A',
          roleId: payload.roleId || payload.role_id || 'N/A',
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
        }
      });
    } catch (error) {
      logger.debug(`[${context}] Erreur décodage JWT`, { 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      });
    }
  }
}