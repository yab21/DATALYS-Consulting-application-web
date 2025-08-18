"use client";

export interface ErrorContext {
  url?: string;
  method?: string;
  status?: number;
  timestamp: string;
  userAgent: string;
  userId?: string;
  component?: string;
  action?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  type: 'network' | 'api' | 'validation' | 'auth' | 'permission' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  originalError?: Error;
  retryable: boolean;
  fallbackAvailable: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: ErrorDetails) => boolean;
}

export interface FallbackConfig {
  enableCaching: boolean;
  cacheKey?: string;
  defaultData?: any;
  offlineMessage?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorDetails[] = [];
  private retryQueue: Map<string, number> = new Map();
  private fallbackCache: Map<string, any> = new Map();
  
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error) => error.retryable && error.type !== 'auth'
  };

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Configuration des gestionnaires d'erreurs globaux
   */
  private setupGlobalErrorHandlers() {
    if (typeof window !== 'undefined') {
      // Gestionnaire d'erreurs JavaScript non capturées
      window.addEventListener('error', (event) => {
        this.handleError({
          code: 'JS_ERROR',
          message: event.message,
          type: 'unknown',
          severity: 'medium',
          context: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            component: 'global'
          },
          originalError: event.error,
          retryable: false,
          fallbackAvailable: false
        });
      });

      // Gestionnaire de promesses rejetées
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError({
          code: 'UNHANDLED_PROMISE',
          message: event.reason?.message || 'Unhandled promise rejection',
          type: 'unknown',
          severity: 'medium',
          context: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            component: 'global'
          },
          originalError: event.reason,
          retryable: false,
          fallbackAvailable: false
        });
      });

      // Gestionnaire d'erreurs réseau - Surveillances plus intelligente
      let isReallyOffline = false;
      window.addEventListener('offline', () => {
        // Attendre un délai pour vérifier si c'est vraiment hors ligne
        setTimeout(() => {
          if (!navigator.onLine) {
            isReallyOffline = true;
            this.handleError({
              code: 'NETWORK_OFFLINE',
              message: 'Connexion Internet perdue',
              type: 'network',
              severity: 'high',
              context: {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                component: 'network'
              },
              retryable: true,
              fallbackAvailable: true
            });
          }
        }, 1000); // Délai de 1 seconde pour éviter les faux positifs
      });

      // Gérer le retour en ligne
      window.addEventListener('online', () => {
        if (isReallyOffline) {
          isReallyOffline = false;
          // Notification de retour en ligne optionnelle
          this.showUserNotification({
            type: 'info',
            title: 'Connexion rétablie',
            message: 'La connexion Internet a été rétablie',
            persistent: false
          });
        }
      });
    }
  }

  /**
   * Analyser et classifier une erreur
   */
  public analyzeError(error: any, context: Partial<ErrorContext> = {}): ErrorDetails {
    const errorDetails: ErrorDetails = {
      code: 'UNKNOWN_ERROR',
      message: 'Une erreur inattendue s\'est produite',
      type: 'unknown',
      severity: 'medium',
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        ...context
      },
      originalError: error,
      retryable: false,
      fallbackAvailable: false
    };

    // Analyser les erreurs HTTP
    if (error?.status || error?.statusCode) {
      const status = error.status || error.statusCode;
      errorDetails.context.status = status;
      
      switch (true) {
        case status === 401:
          errorDetails.code = 'AUTH_UNAUTHORIZED';
          errorDetails.message = 'Session expirée, veuillez vous reconnecter';
          errorDetails.type = 'auth';
          errorDetails.severity = 'high';
          errorDetails.retryable = false;
          break;
          
        case status === 403:
          errorDetails.code = 'AUTH_FORBIDDEN';
          errorDetails.message = 'Accès non autorisé';
          errorDetails.type = 'permission';
          errorDetails.severity = 'high';
          errorDetails.retryable = false;
          break;
          
        case status === 404:
          errorDetails.code = 'NOT_FOUND';
          errorDetails.message = 'Ressource non trouvée';
          errorDetails.type = 'api';
          errorDetails.severity = 'medium';
          errorDetails.retryable = false;
          errorDetails.fallbackAvailable = true;
          break;
          
        case status === 429:
          errorDetails.code = 'RATE_LIMITED';
          errorDetails.message = 'Trop de requêtes, veuillez patienter';
          errorDetails.type = 'api';
          errorDetails.severity = 'medium';
          errorDetails.retryable = true;
          break;
          
        case status >= 500:
          errorDetails.code = 'SERVER_ERROR';
          errorDetails.message = 'Erreur serveur, veuillez réessayer';
          errorDetails.type = 'api';
          errorDetails.severity = 'high';
          errorDetails.retryable = true;
          errorDetails.fallbackAvailable = true;
          break;
          
        case status >= 400:
          errorDetails.code = 'CLIENT_ERROR';
          errorDetails.message = error.message || 'Données invalides';
          errorDetails.type = 'validation';
          errorDetails.severity = 'medium';
          errorDetails.retryable = false;
          break;
      }
    }
    
    // Analyser les erreurs réseau
    else if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
      errorDetails.code = 'NETWORK_ERROR';
      errorDetails.message = 'Problème de connexion réseau';
      errorDetails.type = 'network';
      errorDetails.severity = 'high';
      errorDetails.retryable = true;
      errorDetails.fallbackAvailable = true;
    }
    
    // Analyser les erreurs de timeout
    else if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
      errorDetails.code = 'TIMEOUT_ERROR';
      errorDetails.message = 'Délai d\'attente dépassé';
      errorDetails.type = 'network';
      errorDetails.severity = 'medium';
      errorDetails.retryable = true;
      errorDetails.fallbackAvailable = true;
    }
    
    // Analyser les erreurs API personnalisées
    else if (error?.message) {
      errorDetails.message = error.message;
      if (error.message.toLowerCase().includes('token')) {
        errorDetails.type = 'auth';
        errorDetails.code = 'TOKEN_ERROR';
        errorDetails.severity = 'high';
      }
    }

    return errorDetails;
  }

  /**
   * Gestionnaire principal d'erreurs
   */
  public async handleError(errorDetails: ErrorDetails): Promise<void> {
    // Ajouter à la queue d'erreurs
    this.errorQueue.push(errorDetails);
    
    // Logger l'erreur
    this.logError(errorDetails);
    
    // Gérer selon la sévérité
    switch (errorDetails.severity) {
      case 'critical':
        await this.handleCriticalError(errorDetails);
        break;
      case 'high':
        await this.handleHighSeverityError(errorDetails);
        break;
      case 'medium':
        await this.handleMediumSeverityError(errorDetails);
        break;
      case 'low':
        await this.handleLowSeverityError(errorDetails);
        break;
    }
  }

  /**
   * Retry avec backoff exponentiel
   */
  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationId: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    const currentRetries = this.retryQueue.get(operationId) || 0;
    
    try {
      const result = await operation();
      // Succès - nettoyer le compteur de retry
      this.retryQueue.delete(operationId);
      return result;
    } catch (error) {
      const errorDetails = this.analyzeError(error, { action: operationId });
      
      // Vérifier si on doit retry
      if (currentRetries >= retryConfig.maxRetries || 
          !retryConfig.retryCondition?.(errorDetails)) {
        this.retryQueue.delete(operationId);
        throw error;
      }
      
      // Calculer le délai avec backoff exponentiel
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, currentRetries),
        retryConfig.maxDelay
      );
      
      // Incrementer le compteur
      this.retryQueue.set(operationId, currentRetries + 1);
      
      // Attendre avant le retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Retry récursif
      return this.retryWithBackoff(operation, operationId, config);
    }
  }

  /**
   * Gérer les erreurs critiques
   */
  private async handleCriticalError(errorDetails: ErrorDetails): Promise<void> {
    console.error('🚨 ERREUR CRITIQUE:', errorDetails);
    
    // Envoyer au système de monitoring
    await this.sendToMonitoring(errorDetails);
    
    // Notifier l'utilisateur
    this.showUserNotification({
      type: 'error',
      title: 'Erreur critique',
      message: 'Une erreur grave s\'est produite. L\'équipe technique a été notifiée.',
      persistent: true
    });
  }

  /**
   * Gérer les erreurs de haute sévérité
   */
  private async handleHighSeverityError(errorDetails: ErrorDetails): Promise<void> {
    console.error('⚠️ ERREUR HAUTE SÉVÉRITÉ:', errorDetails);
    
    // Tentative de fallback si disponible
    if (errorDetails.fallbackAvailable) {
      await this.applyFallback(errorDetails);
    }
    
    // Notifier l'utilisateur
    this.showUserNotification({
      type: 'error',
      title: 'Erreur',
      message: errorDetails.message,
      persistent: false
    });
  }

  /**
   * Gérer les erreurs de moyenne sévérité
   */
  private async handleMediumSeverityError(errorDetails: ErrorDetails): Promise<void> {
    console.warn('⚠️ ERREUR MOYENNE:', errorDetails);
    
    // Fallback silencieux si disponible
    if (errorDetails.fallbackAvailable) {
      await this.applyFallback(errorDetails);
    }
    
    // Notification discrète
    this.showUserNotification({
      type: 'warning',
      title: 'Attention',
      message: errorDetails.message,
      persistent: false
    });
  }

  /**
   * Gérer les erreurs de faible sévérité
   */
  private async handleLowSeverityError(errorDetails: ErrorDetails): Promise<void> {
    console.info('ℹ️ ERREUR FAIBLE:', errorDetails);
    
    // Fallback silencieux uniquement
    if (errorDetails.fallbackAvailable) {
      await this.applyFallback(errorDetails);
    }
  }

  /**
   * Appliquer un fallback
   */
  private async applyFallback(errorDetails: ErrorDetails): Promise<void> {
    const cacheKey = this.generateCacheKey(errorDetails);
    
    // Vérifier le cache local
    if (this.fallbackCache.has(cacheKey)) {
      console.info('📦 Utilisation du cache local pour:', cacheKey);
      return;
    }
    
    // Vérifier le localStorage
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(`fallback_${cacheKey}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          this.fallbackCache.set(cacheKey, parsed);
          console.info('💾 Utilisation du localStorage pour:', cacheKey);
          return;
        } catch (e) {
          // Cache corrompu, le supprimer
          localStorage.removeItem(`fallback_${cacheKey}`);
        }
      }
    }
    
    // Fallback par défaut selon le type d'erreur
    switch (errorDetails.type) {
      case 'network':
        this.showUserNotification({
          type: 'info',
          title: 'Mode hors ligne',
          message: 'Fonctionnement en mode hors ligne avec les données en cache',
          persistent: false
        });
        break;
        
      case 'api':
        console.info('🔄 Utilisation des données par défaut');
        break;
    }
  }

  /**
   * Logger les erreurs
   */
  private logError(errorDetails: ErrorDetails): void {
    const logEntry = {
      ...errorDetails,
      timestamp: new Date().toISOString(),
      stackTrace: errorDetails.originalError?.stack
    };
    
    // Console logging avec couleurs
    const logMethod = errorDetails.severity === 'critical' ? 'error' : 
                     errorDetails.severity === 'high' ? 'error' :
                     errorDetails.severity === 'medium' ? 'warn' : 'info';
    
    console[logMethod](`[${errorDetails.severity.toUpperCase()}] ${errorDetails.code}:`, logEntry);
  }

  /**
   * Envoyer au système de monitoring
   */
  private async sendToMonitoring(errorDetails: ErrorDetails): Promise<void> {
    try {
      // Ici on pourrait envoyer à Sentry, LogRocket, etc.
      // Pour l'instant, on stocke localement
      const monitoringData = {
        ...errorDetails,
        timestamp: new Date().toISOString(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      };
      
      if (typeof window !== 'undefined') {
        const existingLogs = localStorage.getItem('error_monitoring') || '[]';
        const logs = JSON.parse(existingLogs);
        logs.push(monitoringData);
        
        // Garder seulement les 100 dernières erreurs
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('error_monitoring', JSON.stringify(logs));
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi au monitoring:', error);
    }
  }

  /**
   * Afficher une notification utilisateur
   */
  private showUserNotification(notification: {
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    persistent: boolean;
  }): void {
    // Émettre un événement personnalisé que le système de notification peut écouter
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('global-error-notification', {
        detail: notification
      }));
    }
  }

  /**
   * Générer une clé de cache
   */
  private generateCacheKey(errorDetails: ErrorDetails): string {
    return `${errorDetails.context.url}_${errorDetails.context.method}_${errorDetails.code}`;
  }

  /**
   * Obtenir l'ID de session
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  /**
   * Obtenir les statistiques d'erreurs
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorDetails[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    this.errorQueue.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });
    
    return {
      totalErrors: this.errorQueue.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorQueue.slice(-10)
    };
  }

  /**
   * Nettoyer les anciennes erreurs
   */
  public cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.errorQueue = this.errorQueue.filter(error => 
      new Date(error.context.timestamp).getTime() > oneHourAgo
    );
  }
}

// Instance singleton
export const errorHandler = ErrorHandler.getInstance();

// Utilitaires d'export
export const handleError = (error: any, context?: Partial<ErrorContext>) => {
  const errorDetails = errorHandler.analyzeError(error, context);
  return errorHandler.handleError(errorDetails);
};

export const retryOperation = <T>(
  operation: () => Promise<T>,
  operationId: string,
  config?: Partial<RetryConfig>
) => errorHandler.retryWithBackoff(operation, operationId, config);

export default errorHandler;