'use client';

import React from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip, 
  Switch,
  Divider,
  Spinner,
  Progress
} from '@nextui-org/react';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Settings,
  TestTube,
  Smartphone,
  WifiOff
} from 'lucide-react';
import { useFCMIntegration } from '@/hooks/useFCMIntegration';
import { useAdvancedNotifications } from './AdvancedNotificationProvider';

export default function FCMSettings() {
  const { 
    fcmStatus, 
    requestPermission, 
    testNotification, 
    isReady, 
    canRequestPermission, 
    needsPermission 
  } = useFCMIntegration();
  
  const { settings, updateSettings } = useAdvancedNotifications();

  const getStatusColor = () => {
    if (fcmStatus.isLoading) return 'default';
    if (fcmStatus.error) return 'danger';
    if (isReady) return 'success';
    if (needsPermission) return 'warning';
    return 'default';
  };

  const getStatusIcon = () => {
    if (fcmStatus.isLoading) return <Spinner size="sm" />;
    if (fcmStatus.error) return <AlertTriangle className="w-4 h-4" />;
    if (isReady) return <CheckCircle className="w-4 h-4" />;
    if (needsPermission) return <BellOff className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (fcmStatus.isLoading) return 'Initialisation...';
    if (fcmStatus.error) return fcmStatus.error;
    if (isReady) return 'Notifications push actives';
    if (needsPermission) return 'Permission requise';
    if (!fcmStatus.isSupported) return 'Non supporté sur ce navigateur';
    return 'Non configuré';
  };

  const handleRequestPermission = async () => {
    const permission = await requestPermission();
    if (permission === 'granted') {
      // Notification de succès sera ajoutée automatiquement par le hook
    }
  };

  if (!fcmStatus.isSupported) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold">Notifications Push</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="text-center py-4">
            <WifiOff className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500 mb-2">
              Les notifications push ne sont pas supportées sur ce navigateur
            </p>
            <p className="text-sm text-gray-400">
              Utilisez Chrome, Firefox, Safari ou Edge pour activer cette fonctionnalité
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Notifications Push</h3>
          </div>
          
          <Chip
            color={getStatusColor()}
            variant="flat"
            size="sm"
            startContent={getStatusIcon()}
          >
            {getStatusText()}
          </Chip>
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Status général */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Support navigateur</span>
            <Chip 
              color={fcmStatus.isSupported ? 'success' : 'danger'} 
              size="sm" 
              variant="flat"
            >
              {fcmStatus.isSupported ? 'Supporté' : 'Non supporté'}
            </Chip>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Permissions</span>
            <Chip 
              color={fcmStatus.hasPermission ? 'success' : 'warning'} 
              size="sm" 
              variant="flat"
            >
              {fcmStatus.hasPermission ? 'Accordées' : 'Non accordées'}
            </Chip>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Token FCM</span>
            <Chip 
              color={fcmStatus.token ? 'success' : 'default'} 
              size="sm" 
              variant="flat"
            >
              {fcmStatus.token ? 'Configuré' : 'Non configuré'}
            </Chip>
          </div>
        </div>

        <Divider />

        {/* Actions */}
        <div className="space-y-3">
          {canRequestPermission && (
            <Button
              color="primary"
              variant="flat"
              onPress={handleRequestPermission}
              isLoading={fcmStatus.isLoading}
              startContent={<Bell className="w-4 h-4" />}
              className="w-full"
            >
              Activer les notifications push
            </Button>
          )}

          {isReady && (
            <Button
              color="secondary"
              variant="flat"
              onPress={testNotification}
              startContent={<TestTube className="w-4 h-4" />}
              className="w-full"
            >
              Tester les notifications
            </Button>
          )}
        </div>

        {/* Paramètres des notifications */}
        {fcmStatus.isSupported && (
          <>
            <Divider />
            
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Paramètres des notifications</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Son</span>
                  <Switch
                    size="sm"
                    isSelected={settings.soundEnabled}
                    onValueChange={(checked) => 
                      updateSettings({ soundEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications bureau</span>
                  <Switch
                    size="sm"
                    isSelected={settings.desktopEnabled}
                    onValueChange={(checked) => 
                      updateSettings({ desktopEnabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications par email</span>
                  <Switch
                    size="sm"
                    isSelected={settings.emailEnabled}
                    onValueChange={(checked) => 
                      updateSettings({ emailEnabled: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Divider />

            {/* Catégories de notifications */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Catégories</h4>
              
              <div className="space-y-2">
                {Object.entries(settings.categories).map(([category, enabled]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {category === 'general' && 'Général'}
                      {category === 'project' && 'Projets'}
                      {category === 'security' && 'Sécurité'}
                      {category === 'system' && 'Système'}
                      {category === 'communication' && 'Communication'}
                    </span>
                    <Switch
                      size="sm"
                      isSelected={enabled}
                      onValueChange={(checked) => 
                        updateSettings({ 
                          categories: { 
                            ...settings.categories, 
                            [category]: checked 
                          } 
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Informations de debug */}
        {process.env.NODE_ENV === 'development' && fcmStatus.token && (
          <>
            <Divider />
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-gray-500">Debug Info</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs">
                <div>Token: {fcmStatus.token.substring(0, 20)}...</div>
                <div>Initialized: {fcmStatus.isInitialized.toString()}</div>
                <div>Permission: {Notification.permission}</div>
              </div>
            </div>
          </>
        )}

        {/* Messages d'aide */}
        {needsPermission && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium mb-1">Permission requise</p>
                <p>
                  Pour recevoir des notifications push, vous devez autoriser les notifications 
                  dans votre navigateur. Cliquez sur "Activer les notifications push" ci-dessus.
                </p>
              </div>
            </div>
          </div>
        )}

        {fcmStatus.error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium mb-1">Erreur</p>
                <p>{fcmStatus.error}</p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}