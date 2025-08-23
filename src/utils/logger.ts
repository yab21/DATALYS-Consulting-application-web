/**
 * Système de logging sécurisé pour DATALYS Consulting
 * Évite l'exposition de données sensibles en production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  component?: string;
}

class SecureLogger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message: this.sanitizeMessage(message),
      data: this.sanitizeData(data),
      component
    };
  }

  private sanitizeMessage(message: string): string {
    if (!this.isDevelopment) {
      // En production, on évite d'exposer des détails techniques
      return message.replace(/ID:\s*\d+/gi, 'ID: [REDACTED]')
                   .replace(/token|password|secret|key/gi, '[CREDENTIAL]')
                   .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_ADDRESS]');
    }
    return message;
  }

  private sanitizeData(data: any): any {
    if (!this.isDevelopment) {
      if (typeof data === 'object' && data !== null) {
        // En production, on évite de logger les objets complets
        return { type: typeof data, keys: Object.keys(data).length };
      }
      return typeof data;
    }
    return data;
  }

  private log(level: LogLevel, message: string, data?: any, component?: string): void {
    const logEntry = this.createLogEntry(level, message, data, component);
    
    // Conserver un historique limité même en production (pour debug post-mortem)
    this.logHistory.push(logEntry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Log sur console seulement en développement
    if (this.isDevelopment) {
      const logMethod = console[level] || console.log;
      const prefix = `🔧 [${level.toUpperCase()}] ${component ? `[${component}]` : ''}`;
      
      if (data !== undefined) {
        logMethod(`${prefix} ${message}`, data);
      } else {
        logMethod(`${prefix} ${message}`);
      }
    }
  }

  /**
   * Log de debug (développement seulement)
   */
  debug(message: string, data?: any, component?: string): void {
    this.log('debug', message, data, component);
  }

  /**
   * Log d'information
   */
  info(message: string, data?: any, component?: string): void {
    this.log('info', message, data, component);
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, data?: any, component?: string): void {
    this.log('warn', message, data, component);
  }

  /**
   * Log d'erreur (toujours affiché mais sanitisé)
   */
  error(message: string, error?: any, component?: string): void {
    this.log('error', message, error, component);
    
    // En production, on log quand même les erreurs critiques
    // mais de manière sanitisée
    if (!this.isDevelopment && error) {
      console.error(`🚨 [PRODUCTION ERROR] ${component ? `[${component}]` : ''} ${this.sanitizeMessage(message)}`);
    }
  }

  /**
   * Récupérer l'historique des logs (utile pour le support)
   */
  getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Nettoyer l'historique
   */
  clearHistory(): void {
    this.logHistory = [];
  }
}

// Instance singleton
export const logger = new SecureLogger();

// Utilitaires de logging par composant
export const createComponentLogger = (componentName: string) => ({
  debug: (message: string, data?: any) => logger.debug(message, data, componentName),
  info: (message: string, data?: any) => logger.info(message, data, componentName),
  warn: (message: string, data?: any) => logger.warn(message, data, componentName),
  error: (message: string, error?: any) => logger.error(message, error, componentName),
});

// Export des méthodes principales
export const { debug, info, warn, error } = logger;