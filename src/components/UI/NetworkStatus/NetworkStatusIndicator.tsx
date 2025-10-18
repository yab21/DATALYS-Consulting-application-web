'use client';

import React, { useState } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useRequestQueue } from '@/lib/request-queue';
import { 
  Wifi, 
  WifiOff, 
  Signal, 
  SignalLow, 
  RefreshCw, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
// Composants UI temporaires (remplacer par shadcn/ui si disponible)
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`${className}`}>{children}</div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  size = 'default',
  variant = 'default',
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    default: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
    ghost: 'bg-transparent hover:bg-gray-100',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({
  children,
  variant = 'default',
  className = '',
  onClick
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
  className?: string;
  onClick?: () => void;
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-900',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-200 bg-transparent text-gray-900'
  };
  
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component 
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${variantClasses[variant]} ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {children}
    </Component>
  );
};

interface NetworkStatusIndicatorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  detailed?: boolean;
  showQueue?: boolean;
  className?: string;
}

export function NetworkStatusIndicator({ 
  position = 'top-right',
  detailed = false,
  showQueue = false,
  className = ''
}: NetworkStatusIndicatorProps) {
  const networkStatus = useNetworkStatus();
  const { stats, retryFailedRequests, clearFailedQueue } = useRequestQueue();
  const [showDetails, setShowDetails] = useState(false);

  const {
    isOnline,
    isConnecting,
    connectionType,
    lastConnected,
    retryCount,
    checkConnection,
    retry,
    resetRetryCount
  } = networkStatus;

  // Classes CSS pour le positionnement
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  // Icône selon l'état de la connexion
  const getStatusIcon = () => {
    if (isConnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    switch (connectionType) {
      case 'fast':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'slow':
        return <SignalLow className="h-4 w-4 text-yellow-500" />;
      default:
        return <Signal className="h-4 w-4 text-gray-500" />;
    }
  };

  // Couleur du badge selon l'état
  const getStatusColor = (): 'default' | 'success' | 'warning' | 'destructive' => {
    if (!isOnline) return 'destructive';
    if (connectionType === 'slow') return 'warning';
    if (connectionType === 'fast') return 'success';
    return 'default';
  };

  // Texte du statut
  const getStatusText = () => {
    if (isConnecting) return 'Connexion...';
    if (!isOnline) return 'Hors ligne';
    
    switch (connectionType) {
      case 'fast':
        return 'Connexion rapide';
      case 'slow':
        return 'Connexion lente';
      default:
        return 'En ligne';
    }
  };

  // Format de la dernière connexion
  const formatLastConnected = () => {
    if (!lastConnected) return 'Jamais';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastConnected.getTime()) / 1000);
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return lastConnected.toLocaleDateString();
  };

  // Composant simple (non détaillé)
  if (!detailed) {
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
        title={getStatusText()}
      >
        <Badge 
          variant={getStatusColor()}
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        {showDetails && (
          <Card className="absolute top-full mt-2 right-0 w-64 shadow-lg">
            <CardContent className="p-3">
              <NetworkStatusDetails 
                networkStatus={networkStatus}
                queueStats={showQueue ? stats : undefined}
                onRetryFailed={retryFailedRequests}
                onClearFailed={clearFailedQueue}
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Composant détaillé
  return (
    <Card className={`${className} border-l-4 ${
      isOnline ? 'border-l-green-500' : 'border-l-red-500'
    }`}>
      <CardContent className="p-4">
        <NetworkStatusDetails 
          networkStatus={networkStatus}
          queueStats={showQueue ? stats : undefined}
          onRetryFailed={retryFailedRequests}
          onClearFailed={clearFailedQueue}
        />
      </CardContent>
    </Card>
  );
}

// Composant pour les détails du statut
interface NetworkStatusDetailsProps {
  networkStatus: ReturnType<typeof useNetworkStatus>;
  queueStats?: ReturnType<typeof useRequestQueue>['stats'];
  onRetryFailed?: () => void;
  onClearFailed?: () => void;
}

function NetworkStatusDetails({ 
  networkStatus, 
  queueStats, 
  onRetryFailed, 
  onClearFailed 
}: NetworkStatusDetailsProps) {
  const {
    isOnline,
    isConnecting,
    connectionType,
    lastConnected,
    retryCount,
    checkConnection,
    retry,
    resetRetryCount
  } = networkStatus;

  return (
    <div className="space-y-3">
      {/* Statut principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          ) : isOnline ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">
            {isConnecting ? 'Vérification...' : isOnline ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
        
        <Badge variant={isOnline ? 'success' : 'destructive'}>
          {connectionType}
        </Badge>
      </div>

      {/* Informations détaillées */}
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex justify-between">
          <span>Dernière connexion:</span>
          <span>{lastConnected ? new Date(lastConnected).toLocaleTimeString() : 'Jamais'}</span>
        </div>
        
        {retryCount > 0 && (
          <div className="flex justify-between">
            <span>Tentatives de reconnexion:</span>
            <span>{retryCount}</span>
          </div>
        )}
      </div>

      {/* Statistiques de la queue si disponibles */}
      {queueStats && (
        <div className="border-t pt-3">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
            <Clock className="h-4 w-4" />
            File d'attente
          </h4>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>En attente:</span>
              <Badge variant="outline">{queueStats.pending}</Badge>
            </div>
            
            {queueStats.failed > 0 && (
              <div className="flex justify-between">
                <span>Échouées:</span>
                <Badge variant="destructive">{queueStats.failed}</Badge>
              </div>
            )}
            
            {queueStats.processing && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Traitement en cours...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={checkConnection}
          disabled={isConnecting}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isConnecting ? 'animate-spin' : ''}`} />
          Vérifier
        </Button>
        
        {!isOnline && (
          <Button 
            size="sm" 
            variant="default"
            onClick={retry}
            disabled={isConnecting}
          >
            Réessayer
          </Button>
        )}
        
        {retryCount > 0 && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={resetRetryCount}
          >
            Reset
          </Button>
        )}
        
        {queueStats && queueStats.failed > 0 && (
          <>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={onRetryFailed}
            >
              Réessayer échouées
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onClearFailed}
            >
              Effacer échouées
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Hook pour le toast de statut réseau
export function useNetworkStatusToast() {
  const { isOnline } = useNetworkStatus();
  const [wasOnline, setWasOnline] = useState(isOnline);

  React.useEffect(() => {
    if (wasOnline && !isOnline) {
      // Connexion perdue
      console.log('📵 Connexion Internet perdue');
      // Ici vous pouvez ajouter un toast/notification
    } else if (!wasOnline && isOnline) {
      // Connexion rétablie
      console.log('🌐 Connexion Internet rétablie');
      // Ici vous pouvez ajouter un toast/notification
    }
    
    setWasOnline(isOnline);
  }, [isOnline, wasOnline]);

  return { isOnline, wasOnline };
}

export default NetworkStatusIndicator;