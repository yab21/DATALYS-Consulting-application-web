"use client";

import { getContextualErrorMessage, ERROR_MESSAGES } from './error-messages';

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

/**
 * Extrait le vrai message d'erreur du backend de manière cohérente
 */
function extractBackendMessage(error: any): string {
  // 1. Si c'est une ApiError personnalisée
  if (error?.name === 'ApiError' && error?.message) {
    return error.message;
  }
  
  // 2. Format de réponse API standard avec data
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // 3. Format imbriqué {message: {message: "..."}} - CORRIGÉ POUR BACKEND
  if (error?.message && typeof error.message === 'object' && error.message.message && typeof error.message.message === 'string') {
    return error.message.message;
  }
  
  // 4. Format avec result.message (pour auth service)
  if (error?.result?.message && typeof error.result.message === 'string') {
    return error.result.message;
  }
  
  // 5. Format direct avec status/message
  if (error?.status === 'error' && error?.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // 6. Message direct simple - CORRIGÉ
  if (error?.message && typeof error.message === 'string' && 
      !error.message.startsWith('HTTP ') && 
      !error.message.includes('fetch') &&
      !error.message.includes('toLowerCase')) {
    return error.message;
  }
  
  // 7. Fallback pour erreurs réseau/HTTP
  if (error?.status || error?.statusCode) {
    const status = error.status || error.statusCode;
    return `Erreur serveur (${status})`;
  }
  
  // 8. Dernier recours
  return 'Une erreur inattendue s\'est produite';
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
  userMessage?: string; // Message formaté pour l'utilisateur
  dataType?: 'projects' | 'partners' | 'incidents' | 'users' | 'files' | 'folders' | 'dashboard' | 'analytics' | 'profile' | 'notifications';
  operation?: 'load' | 'save' | 'delete' | 'auth';
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
          if (typeof window !== 'undefined' && !navigator.onLine) {
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
  public analyzeError(
    error: any, 
    context: Partial<ErrorContext> & {
      dataType?: 'projects' | 'partners' | 'incidents' | 'users' | 'files' | 'folders' | 'dashboard' | 'analytics' | 'profile' | 'notifications';
      operation?: 'load' | 'save' | 'delete' | 'auth';
    } = {}
  ): ErrorDetails {
    // Ignorer les erreurs déjà gérées par les services pour éviter les doubles notifications
    if (error?.handled) {
      console.log('🔇 Erreur déjà gérée, ignorée par l\'error handler global');
      return {
        code: 'ALREADY_HANDLED',
        message: 'Erreur déjà gérée',
        type: 'unknown',
        severity: 'low',
        context: {
          timestamp: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
          ...context
        },
        originalError: error,
        retryable: false,
        fallbackAvailable: false
      };
    }
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
      fallbackAvailable: false,
      dataType: context.dataType,
      operation: context.operation || 'load'
    };

    // Extraire le vrai message du backend
    const backendMessage = extractBackendMessage(error);

    // PRIORITÉ 1: Analyser les erreurs HTTP EN PREMIER - utiliser le status du contexte si pas dans l'erreur
    const httpStatus = error?.status || error?.statusCode || context?.status;
    if (httpStatus) {
      const status = httpStatus;
      errorDetails.context.status = status;
      
      switch (true) {
        case status === 401:
          errorDetails.code = 'AUTH_UNAUTHORIZED';
          errorDetails.message = backendMessage.includes('Session') || backendMessage.includes('Token') || backendMessage.includes('Unauthorized') 
            ? backendMessage 
            : 'Session expirée, veuillez vous reconnecter';
          errorDetails.type = 'auth';
          errorDetails.severity = 'high';
          errorDetails.retryable = false;
          break;
          
        case status === 403:
          errorDetails.code = 'AUTH_FORBIDDEN';
          errorDetails.message = backendMessage.includes('Forbidden') || backendMessage.includes('accès') 
            ? backendMessage 
            : 'Accès non autorisé';
          errorDetails.type = 'permission';
          errorDetails.severity = 'high';
          errorDetails.retryable = false;
          break;
          
        case status === 404:
          errorDetails.code = 'NOT_FOUND';
          errorDetails.message = backendMessage.includes('Not Found') || backendMessage.includes('trouvé') 
            ? backendMessage 
            : 'Ressource non trouvée';
          errorDetails.type = 'api';
          errorDetails.severity = 'medium';
          errorDetails.retryable = false;
          errorDetails.fallbackAvailable = true;
          break;
          
        case status === 429:
          errorDetails.code = 'RATE_LIMITED';
          errorDetails.message = backendMessage.includes('rate') || backendMessage.includes('limite') 
            ? backendMessage 
            : 'Trop de requêtes, veuillez patienter';
          errorDetails.type = 'api';
          errorDetails.severity = 'medium';
          errorDetails.retryable = true;
          break;
          
        case status >= 500:
          errorDetails.code = 'SERVER_ERROR';
          errorDetails.message = backendMessage !== 'Une erreur inattendue s\'est produite' 
            ? backendMessage 
            : 'Erreur serveur, veuillez réessayer';
          errorDetails.type = 'api';
          errorDetails.severity = 'high';
          errorDetails.retryable = true;
          errorDetails.fallbackAvailable = true;
          break;
          
        case status >= 400:
          errorDetails.code = 'CLIENT_ERROR';
          errorDetails.message = backendMessage !== 'Une erreur inattendue s\'est produite' 
            ? backendMessage 
            : 'Données invalides';
          errorDetails.type = 'validation';
          errorDetails.severity = 'medium';
          errorDetails.retryable = false;
          // Pour les erreurs de validation, utiliser directement le message backend
          errorDetails.userMessage = backendMessage !== 'Une erreur inattendue s\'est produite' 
            ? backendMessage 
            : 'Données invalides';
          break;
      }
    }
    
    // Analyser les erreurs réseau avec détection avancée
    else if (this.isNetworkError(error)) {
      const networkErrorType = this.detectNetworkErrorType(error);
      
      switch (networkErrorType) {
        case 'connection_lost':
          errorDetails.code = 'CONNECTION_LOST';
          errorDetails.message = 'Connexion Internet perdue';
          errorDetails.type = 'network';
          errorDetails.severity = 'high';
          errorDetails.retryable = true;
          errorDetails.fallbackAvailable = true;
          break;
          
        case 'slow_connection':
          errorDetails.code = 'SLOW_CONNECTION';
          errorDetails.message = 'Connexion lente détectée';
          errorDetails.type = 'network';
          errorDetails.severity = 'medium';
          errorDetails.retryable = true;
          errorDetails.fallbackAvailable = true;
          break;
          
        case 'dns_failure':
          errorDetails.code = 'DNS_FAILURE';
          errorDetails.message = 'Problème de résolution DNS';
          errorDetails.type = 'network';
          errorDetails.severity = 'high';
          errorDetails.retryable = true;
          errorDetails.fallbackAvailable = false;
          break;
          
        default:
          errorDetails.code = 'NETWORK_ERROR';
          errorDetails.message = 'Problème de connexion réseau';
          errorDetails.type = 'network';
          errorDetails.severity = 'high';
          errorDetails.retryable = true;
          errorDetails.fallbackAvailable = true;
      }
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
    else {
      errorDetails.message = backendMessage;
      if (typeof backendMessage === 'string' && backendMessage.toLowerCase().includes('token')) {
        errorDetails.type = 'auth';
        errorDetails.code = 'TOKEN_ERROR';
        errorDetails.severity = 'high';
      }
    }

    // Générer le message utilisateur approprié seulement si pas déjà défini
    if (!errorDetails.userMessage) {
      errorDetails.userMessage = getContextualErrorMessage(error, {
        operation: errorDetails.operation,
        dataType: errorDetails.dataType,
        fallback: errorDetails.message
      });
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
    
    // Notifier l'utilisateur avec le message approprié
    this.showUserNotification({
      type: 'error',
      title: 'Erreur',
      message: errorDetails.userMessage || errorDetails.message,
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
    
    // Notification discrète avec message approprié
    this.showUserNotification({
      type: 'warning',
      title: 'Attention',
      message: errorDetails.userMessage || errorDetails.message,
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
        const randomBytes = new Uint8Array(8);
        crypto.getRandomValues(randomBytes);
        const randomHex = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
        sessionId = `session_${Date.now()}_${randomHex}`;
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
   * Détecter si c'est une erreur réseau
   */
  private isNetworkError(error: any): boolean {
    // Si l'erreur a un status HTTP, ce n'est PAS une erreur réseau
    const httpStatus = error?.status || error?.statusCode;
    if (httpStatus) {
      return false;
    }

    // Extraire le message en toute sécurité
    const errorMessage = typeof error?.message === 'string' 
      ? error.message 
      : typeof error?.message === 'object' && error.message?.message 
        ? error.message.message 
        : '';

    return (
      error?.name === 'NetworkError' ||
      (error?.name === 'TypeError' && (
        // TypeError seulement si c'est lié au réseau, pas à la manipulation d'objets
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch')
      )) ||
      (typeof errorMessage === 'string' && (
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('ERR_NETWORK') ||
        errorMessage.includes('ERR_INTERNET_DISCONNECTED')
      )) ||
      (typeof window !== 'undefined' && !navigator.onLine)
    );
  }

  /**
   * Détecter le type d'erreur réseau
   */
  private detectNetworkErrorType(error: any): 'connection_lost' | 'slow_connection' | 'dns_failure' | 'generic' {
    const errorMessage = error?.message?.toLowerCase() || '';
    
    // Vérifier si hors ligne
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return 'connection_lost';
    }
    
    // Détecter les erreurs DNS
    if (errorMessage.includes('dns') || 
        errorMessage.includes('getaddrinfo') ||
        errorMessage.includes('name resolution')) {
      return 'dns_failure';
    }
    
    // Détecter les connexions lentes (timeout court)
    if (errorMessage.includes('timeout') && 
        this.isSlowConnectionDetected()) {
      return 'slow_connection';
    }
    
    // Détecter la perte de connexion
    if (errorMessage.includes('internet_disconnected') ||
        errorMessage.includes('network_changed') ||
        errorMessage.includes('connection_lost')) {
      return 'connection_lost';
    }
    
    return 'generic';
  }

  /**
   * Détecter une connexion lente
   */
  private isSlowConnectionDetected(): boolean {
    // Utiliser l'API Network Information si disponible
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        // Connexion lente si effective type est slow-2g ou 2g
        return connection.effectiveType === 'slow-2g' || 
               connection.effectiveType === '2g' ||
               connection.downlink < 1; // Moins de 1 Mbps
      }
    }
    
    // Fallback: vérifier les métriques de performance récentes
    return this.checkRecentPerformanceMetrics();
  }

  /**
   * Vérifier les métriques de performance récentes
   */
  private checkRecentPerformanceMetrics(): boolean {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        const entry = entries[0];
        // Considérer comme lent si le temps de réponse > 3 secondes
        const responseTime = entry.responseEnd - entry.responseStart;
        return responseTime > 3000;
      }
    }
    return false;
  }

  /**
   * Intégration avec la queue de requêtes
   */
  public async handleNetworkError(
    error: any, 
    request: { url: string; options?: RequestInit },
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> {
    const errorDetails = this.analyzeError(error, {
      url: request.url,
      method: request.options?.method || 'GET'
    });

    // Si c'est une erreur réseau retryable, ajouter à la queue
    if (errorDetails.type === 'network' && errorDetails.retryable) {
      try {
        // Import dynamique pour éviter les dépendances circulaires
        const { requestQueue } = await import('./request-queue');
        
        await requestQueue.enqueue(
          request.url,
          request.options || {},
          priority,
          3, // maxRetries
          {
            description: `Retry après erreur: ${errorDetails.message}`,
            component: errorDetails.context.component
          }
        );
        
        console.log('📋 Requête ajoutée à la queue de retry réseau');
      } catch (queueError) {
        console.error('Erreur lors de l\'ajout à la queue:', queueError);
      }
    }

    // Gérer l'erreur normalement
    await this.handleError(errorDetails);
  }

  /**
   * Vérifier la qualité de la connexion réseau
   */
  public async checkNetworkQuality(): Promise<{
    isOnline: boolean;
    quality: 'excellent' | 'good' | 'poor' | 'offline';
    latency?: number;
    bandwidth?: number;
  }> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return { isOnline: false, quality: 'offline' };
    }

    try {
      const startTime = performance.now();
      
      // Test avec une petite requête
      const response = await fetch('/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const endTime = performance.now();
      const latency = endTime - startTime;

      let quality: 'excellent' | 'good' | 'poor' = 'good';
      
      if (latency < 100) {
        quality = 'excellent';
      } else if (latency > 1000) {
        quality = 'poor';
      }

      // Vérifier la bande passante si l'API est disponible
      let bandwidth: number | undefined;
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        bandwidth = connection?.downlink;
        
        if (bandwidth && bandwidth < 0.5) {
          quality = 'poor';
        }
      }

      return {
        isOnline: response.ok,
        quality,
        latency,
        bandwidth
      };
    } catch (error) {
      return { isOnline: false, quality: 'offline' };
    }
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

// Export de la fonction utilitaire pour usage dans les services
export { extractBackendMessage };

export default errorHandler;