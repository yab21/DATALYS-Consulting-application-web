"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import { errorHandler } from '@/lib/error-handler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Analyser l'erreur avec le gestionnaire d'erreurs
    const errorDetails = errorHandler.analyzeError(error, {
      component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      action: 'component_render'
    });
    
    // Gérer l'erreur
    errorHandler.handleError(errorDetails);
    
    this.setState({
      error,
      errorInfo,
    });

    // Appeler le callback personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En production, envoyer l'erreur vers un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Service de logging (Sentry, LogRocket, etc.)
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('Sending error to monitoring service:', errorData);
    
    // Simuler l'envoi vers un service externe
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    }).catch(err => {
      console.error('Failed to send error to monitoring service:', err);
    });
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface d'erreur par défaut
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardBody className="p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Une erreur inattendue s'est produite
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Nous nous excusons pour ce désagrément. L'équipe technique a été notifiée.
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Chip size="sm" color="danger" variant="flat">
                      Erreur
                    </Chip>
                    <span className="text-sm font-medium">
                      {this.state.error?.name || 'Erreur inconnue'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {this.state.error?.message || 'Aucun message d\'erreur disponible'}
                  </p>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium mb-2">
                      Détails techniques (mode développement)
                    </summary>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto">
                      {this.state.error?.stack}
                    </pre>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded mt-2 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  color="primary"
                  variant="solid"
                  onPress={this.handleRetry}
                  startContent={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                  }
                >
                  Réessayer
                </Button>
                
                <Button
                  color="default"
                  variant="bordered"
                  onPress={this.handleReload}
                  startContent={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 8l-4 4h3c0 3.31-2.69 6-6 6-1.01 0-1.97-.25-2.8-.7l-1.46 1.46C8.97 19.54 10.43 20 12 20c4.42 0 8-3.58 8-8h3l-4-4zM6 12c0-3.31 2.69-6 6-6 1.01 0 1.97.25 2.8.7l1.46-1.46C15.03 4.46 13.57 4 12 4c-4.42 0-8 3.58-8 8H1l4 4 4-4H6z"/>
                    </svg>
                  }
                >
                  Recharger la page
                </Button>
                
                <Button
                  color="default"
                  variant="light"
                  onPress={() => window.history.back()}
                  startContent={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                  }
                >
                  Retour
                </Button>
              </div>

              <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Si le problème persiste, contactez le support technique à{' '}
                  <a 
                    href="mailto:support@datalys.fr" 
                    className="text-primary-600 hover:underline"
                  >
                    support@datalys.fr
                  </a>
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;