'use client';

import React, { useState, useEffect } from 'react';
import { isTokenExpiredError } from '@/lib/api-interceptor';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Settings,
  ExternalLink
} from 'lucide-react';
import { fcmService } from '@/services/fcm';

interface NotificationPermissionCardProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showInModal?: boolean;
}

export default function NotificationPermissionCard({ 
  onPermissionGranted, 
  onPermissionDenied,
  showInModal = false 
}: NotificationPermissionCardProps) {
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    // Vérifier le statut initial
    const status = fcmService.getPermissionStatus();
    setPermissionStatus(status);
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await fcmService.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        onPermissionGranted?.();
      } else {
        onPermissionDenied?.();
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la demande de permission:', error);
      setPermissionStatus('denied');
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusConfig = () => {
    switch (permissionStatus) {
      case 'granted':
        return {
          icon: CheckCircle,
          color: 'success' as const,
          title: 'Notifications activées',
          description: 'Vous recevrez des notifications push importantes',
          chipText: 'Activé',
          showButton: false
        };
      case 'denied':
        return {
          icon: BellOff,
          color: 'danger' as const,
          title: 'Notifications désactivées',
          description: 'Les notifications sont bloquées dans votre navigateur',
          chipText: 'Bloqué',
          showButton: false,
          showHelp: true
        };
      case 'unsupported':
        return {
          icon: AlertTriangle,
          color: 'warning' as const,
          title: 'Notifications non supportées',
          description: 'Votre navigateur ne supporte pas les notifications push',
          chipText: 'Non supporté',
          showButton: false
        };
      default: // 'default'
        return {
          icon: Bell,
          color: 'primary' as const,
          title: 'Activer les notifications',
          description: 'Recevez des notifications importantes en temps réel',
          chipText: 'À configurer',
          showButton: true
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const cardContent = (
    <Card className="w-full">
      <CardHeader className="flex gap-3">
        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${config.color === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : ''}
          ${config.color === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : ''}
          ${config.color === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20' : ''}
          ${config.color === 'primary' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : ''}
        `}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-3">
            <p className="text-md font-semibold">{config.title}</p>
            <Chip 
              color={config.color} 
              variant="flat" 
              size="sm"
            >
              {config.chipText}
            </Chip>
          </div>
          <p className="text-small text-default-500">{config.description}</p>
        </div>
      </CardHeader>
      
      <CardBody className="pt-0">
        {config.showButton && (
          <div className="flex gap-3">
            <Button
              color="primary"
              onPress={handleRequestPermission}
              isLoading={isRequesting}
              startContent={!isRequesting && <Bell className="w-4 h-4" />}
            >
              {isRequesting ? "Demande en cours..." : "Activer les notifications"}
            </Button>
            <Button
              variant="flat"
              onPress={onOpen}
              startContent={<Info className="w-4 h-4" />}
            >
              Pourquoi ?
            </Button>
          </div>
        )}

        {config.showHelp && (
          <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400 mb-2">
              <strong>Comment réactiver les notifications :</strong>
            </p>
            <ol className="text-sm text-red-600 dark:text-red-400 space-y-1 list-decimal list-inside">
              <li>Cliquez sur l'icône de cadenas ou d'information dans la barre d'adresse</li>
              <li>Changez les notifications de "Bloqué" à "Autoriser"</li>
              <li>Rechargez la page</li>
            </ol>
          </div>
        )}
      </CardBody>

      {/* Modal d'information */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" />
              Pourquoi activer les notifications ?
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm">
                Les notifications push vous permettent de rester informé en temps réel des événements importants :
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Mises à jour de projets</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Nouveaux documents, changements de statut, commentaires
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Messages système</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Maintenance, mises à jour de sécurité, alertes importantes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Communications urgentes</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Messages prioritaires de votre équipe ou administrateur
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>🔒 Confidentialité :</strong> Nous respectons votre vie privée. 
                  Vous pouvez désactiver les notifications à tout moment dans les paramètres.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Fermer
            </Button>
            <Button color="primary" onPress={() => {
              onClose();
              handleRequestPermission();
            }}>
              Activer maintenant
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );

  if (showInModal) {
    return (
      <>
        <Button onPress={onOpen} variant="flat" startContent={<Bell className="w-4 h-4" />}>
          Configurer les notifications
        </Button>
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            <ModalBody className="p-0">
              {cardContent}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return cardContent;
}