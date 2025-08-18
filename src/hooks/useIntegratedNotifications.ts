'use client';

import { useEffect, useCallback } from 'react';
import { useAdvancedNotifications } from '@/components/UI/Notifications/AdvancedNotificationProvider';
import { useRealtimeNotifications } from '@/services/realtime-notifications';
import { usePermissions } from './usePermissions';

// Hook principal pour intégrer notifications locales et temps réel
export function useIntegratedNotifications() {
  const permissions = usePermissions();
  const { addNotification, markAsRead, notifications } = useAdvancedNotifications();
  const { isConnected, error, service } = useRealtimeNotifications(permissions?.userId);

  // S'abonner aux nouvelles notifications du backend
  useEffect(() => {
    if (!permissions?.userId || !service) return;

    const unsubscribe = service.subscribe((backendNotifications) => {
      // Ajouter chaque notification reçue du backend
      backendNotifications.forEach(notification => {
        // Vérifier si la notification n'existe pas déjà
        const exists = notifications.some(n => 
          n.metadata?.backendId === notification.metadata?.backendId
        );
        
        if (!exists) {
          addNotification(notification);
        }
      });
    });

    return unsubscribe;
  }, [permissions?.userId, service, addNotification, notifications]);

  // Marquer comme lu côté backend quand marqué côté frontend
  const markAsReadIntegrated = useCallback(async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    
    // Marquer côté frontend
    markAsRead(notificationId);
    
    // Marquer côté backend si c'est une notification backend
    if (notification?.metadata?.backendId && service) {
      try {
        await service.markAsRead(notification.metadata.backendId);
      } catch (error) {
        console.error('Error marking notification as read on backend:', error);
      }
    }
  }, [notifications, markAsRead, service]);

  // Fonctions pour envoyer des notifications
  const sendMessage = useCallback(async (data: {
    title: string;
    description: string;
    project_id?: number;
    priority?: 'basse' | 'moyenne' | 'haute' | 'critique';
  }) => {
    if (!service) throw new Error('Notification service not available');
    
    try {
      await service.sendMessage(data);
      
      // Ajouter une notification locale de confirmation
      addNotification({
        type: 'success',
        title: 'Message envoyé',
        message: 'Votre message a été envoyé avec succès',
        category: 'communication',
        priority: 'low'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'envoi',
        message: 'Impossible d\'envoyer le message',
        category: 'communication',
        priority: 'high'
      });
      throw error;
    }
  }, [service, addNotification]);

  const createSupportRequest = useCallback(async (data: {
    title: string;
    description: string;
    priority?: 'basse' | 'moyenne' | 'haute' | 'critique';
    project_id?: number;
  }) => {
    if (!service) throw new Error('Notification service not available');
    
    try {
      await service.createSupportRequest(data);
      
      addNotification({
        type: 'success',
        title: 'Demande de support créée',
        message: 'Votre demande de support a été créée avec succès',
        category: 'project',
        priority: 'medium'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de création',
        message: 'Impossible de créer la demande de support',
        category: 'project',
        priority: 'high'
      });
      throw error;
    }
  }, [service, addNotification]);

  const sendNotification = useCallback(async (data: {
    title: string;
    description?: string;
    assigned_to?: number;
    priority?: 'basse' | 'moyenne' | 'haute' | 'critique';
    project_id?: number;
  }) => {
    if (!service) throw new Error('Notification service not available');
    if (!permissions?.isAdmin()) throw new Error('Only admins can send notifications');
    
    try {
      await service.sendNotification(data);
      
      addNotification({
        type: 'success',
        title: 'Notification envoyée',
        message: 'La notification a été envoyée avec succès',
        category: 'system',
        priority: 'low'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'envoi',
        message: 'Impossible d\'envoyer la notification',
        category: 'system',
        priority: 'high'
      });
      throw error;
    }
  }, [service, addNotification, permissions]);

  // Helpers pour notifications rapides selon le contexte utilisateur
  const notify = {
    // Pour les partenaires
    partner: {
      projectUpdate: (projectName: string, message: string) => {
        addNotification({
          type: 'info',
          title: `Mise à jour - ${projectName}`,
          message,
          category: 'project',
          priority: 'medium'
        });
      },
      
      documentAdded: (documentName: string, projectName: string) => {
        addNotification({
          type: 'success',
          title: 'Nouveau document',
          message: `${documentName} ajouté au projet ${projectName}`,
          category: 'project',
          priority: 'medium'
        });
      },
      
      incidentResolved: (incidentTitle: string) => {
        addNotification({
          type: 'success',
          title: 'Incident résolu',
          message: `${incidentTitle} a été résolu`,
          category: 'project',
          priority: 'medium'
        });
      }
    },

    // Pour les admins
    admin: {
      newPartnerRegistered: (partnerName: string) => {
        addNotification({
          type: 'info',
          title: 'Nouveau partenaire',
          message: `${partnerName} s'est inscrit`,
          category: 'general',
          priority: 'medium'
        });
      },
      
      criticalIncident: (projectName: string, description: string) => {
        addNotification({
          type: 'incident',
          title: `Incident critique - ${projectName}`,
          message: description,
          category: 'project',
          priority: 'critical',
          actionRequired: true,
          persistent: true
        });
      },
      
      systemMaintenance: (message: string) => {
        addNotification({
          type: 'warning',
          title: 'Maintenance système',
          message,
          category: 'system',
          priority: 'high'
        });
      }
    },

    // Notifications communes
    common: {
      networkError: () => {
        addNotification({
          type: 'error',
          title: 'Erreur de connexion',
          message: 'Vérifiez votre connexion internet',
          category: 'system',
          priority: 'high'
        });
      },
      
      sessionExpired: () => {
        addNotification({
          type: 'warning',
          title: 'Session expirée',
          message: 'Veuillez vous reconnecter',
          category: 'security',
          priority: 'high',
          persistent: true
        });
      },
      
      featureUpdated: (featureName: string) => {
        addNotification({
          type: 'info',
          title: 'Mise à jour',
          message: `${featureName} a été mis à jour`,
          category: 'system',
          priority: 'low'
        });
      }
    }
  };

  return {
    // État
    isConnected,
    error,
    
    // Actions intégrées
    markAsRead: markAsReadIntegrated,
    sendMessage,
    createSupportRequest,
    sendNotification,
    
    // Helpers contextuels
    notify,
    
    // Accès aux fonctions de base
    addNotification,
    
    // Informations utilisateur
    isAdmin: permissions?.isAdmin() || false,
    isPartner: permissions?.isPartner() || false,
    userId: permissions?.userId,
    
    // Service backend
    service
  };
}

// Hook simplifié pour les notifications rapides
export function useQuickNotify() {
  const { notify, addNotification } = useIntegratedNotifications();
  
  return {
    success: (title: string, message?: string) => 
      addNotification({
        type: 'success',
        title,
        message,
        category: 'general',
        priority: 'medium'
      }),

    error: (title: string, message?: string) => 
      addNotification({
        type: 'error',
        title,
        message,
        category: 'general',
        priority: 'high'
      }),

    warning: (title: string, message?: string) => 
      addNotification({
        type: 'warning',
        title,
        message,
        category: 'general',
        priority: 'medium'
      }),

    info: (title: string, message?: string) => 
      addNotification({
        type: 'info',
        title,
        message,
        category: 'general',
        priority: 'low'
      }),

    // Shortcuts contextuels
    ...notify
  };
}

// Hook pour les statistiques de notifications
export function useNotificationStats() {
  const { notifications, unreadCount, getUnreadByPriority, getNotificationsByCategory } = useAdvancedNotifications();
  const { isConnected, error } = useIntegratedNotifications();

  return {
    total: notifications.length,
    unread: unreadCount,
    
    byPriority: {
      critical: getUnreadByPriority('critical'),
      high: getUnreadByPriority('high'),
      medium: getUnreadByPriority('medium'),
      low: getUnreadByPriority('low'),
    },
    
    byCategory: {
      general: getNotificationsByCategory('general').filter(n => !n.read).length,
      project: getNotificationsByCategory('project').filter(n => !n.read).length,
      security: getNotificationsByCategory('security').filter(n => !n.read).length,
      system: getNotificationsByCategory('system').filter(n => !n.read).length,
      communication: getNotificationsByCategory('communication').filter(n => !n.read).length,
    },
    
    connectionStatus: {
      isConnected,
      error: error?.message
    }
  };
}