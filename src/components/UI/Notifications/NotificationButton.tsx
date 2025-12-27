'use client';

import React, { useEffect } from 'react';
import { Badge, Button, Tooltip } from '@heroui/react';
import { Bell, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdvancedNotifications, useNotificationPermissions } from './AdvancedNotificationProvider';

interface NotificationButtonProps {
  className?: string;
  showTooltip?: boolean;
}

export function NotificationButton({ 
  className = '', 
  showTooltip = true 
}: NotificationButtonProps) {
  const { 
    unreadCount, 
    isDropdownOpen, 
    toggleDropdown,
    getUnreadByPriority 
  } = useAdvancedNotifications();
  
  const { requestPermission, isSupported, isGranted } = useNotificationPermissions();

  // Demander la permission pour les notifications desktop
  useEffect(() => {
    if (isSupported && !isGranted) {
      requestPermission();
    }
  }, [isSupported, isGranted, requestPermission]);

  const criticalCount = getUnreadByPriority('critical');
  const highCount = getUnreadByPriority('high');

  const buttonContent = (
    <Button
      isIconOnly
      variant="light"
      className={`relative ${className}`}
      onPress={toggleDropdown}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
    >
      {/* Icône de base */}
      <div className="relative">
        {unreadCount > 0 ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <BellRing className="w-5 h-5 text-primary" />
          </motion.div>
        ) : (
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}

        {/* Badge pour le nombre total de notifications */}
        {unreadCount > 0 && (
          <Badge
            content={unreadCount > 99 ? '99+' : unreadCount}
            color={criticalCount > 0 ? 'danger' : highCount > 0 ? 'warning' : 'primary'}
            placement="top-right"
            size="sm"
            className="animate-pulse"
          >
            <span></span>
          </Badge>
        )}

        {/* Indicateur critique */}
        {criticalCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </div>

      {/* Animation de pulsation pour les notifications importantes */}
      <AnimatePresence>
        {(criticalCount > 0 || highCount > 0) && (
          <motion.div
            className="absolute inset-0 rounded-full bg-current opacity-20"
            initial={{ scale: 1, opacity: 0.2 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </AnimatePresence>
    </Button>
  );

  if (!showTooltip) {
    return buttonContent;
  }

  const tooltipContent = () => {
    if (unreadCount === 0) return 'Aucune nouvelle notification';
    
    const parts = [];
    if (criticalCount > 0) parts.push(`${criticalCount} critique${criticalCount > 1 ? 's' : ''}`);
    if (highCount > 0) parts.push(`${highCount} importante${highCount > 1 ? 's' : ''}`);
    
    const priorityText = parts.length > 0 ? ` (${parts.join(', ')})` : '';
    return `${unreadCount} notification${unreadCount > 1 ? 's' : ''}${priorityText}`;
  };

  return (
    <Tooltip 
      content={tooltipContent()}
      placement="bottom"
      delay={500}
    >
      {buttonContent}
    </Tooltip>
  );
}

// Composant pour afficher les statistiques de notifications
export function NotificationStats() {
  const { 
    notifications, 
    unreadCount,
    getNotificationsByCategory,
    getUnreadByPriority 
  } = useAdvancedNotifications();

  const stats = {
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
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Statistiques par priorité */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Par priorité
        </h4>
        <div className="space-y-1 text-xs">
          {stats.byPriority.critical > 0 && (
            <div className="flex justify-between">
              <span className="text-danger">Critique</span>
              <Badge content={stats.byPriority.critical} color="danger" size="sm">
                <span></span>
              </Badge>
            </div>
          )}
          {stats.byPriority.high > 0 && (
            <div className="flex justify-between">
              <span className="text-warning">Importante</span>
              <Badge content={stats.byPriority.high} color="warning" size="sm">
                <span></span>
              </Badge>
            </div>
          )}
          {stats.byPriority.medium > 0 && (
            <div className="flex justify-between">
              <span className="text-primary">Moyenne</span>
              <Badge content={stats.byPriority.medium} color="primary" size="sm">
                <span></span>
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques par catégorie */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Par catégorie
        </h4>
        <div className="space-y-1 text-xs">
          {Object.entries(stats.byCategory).map(([category, count]) => 
            count > 0 && (
              <div key={category} className="flex justify-between">
                <span className="capitalize">{category}</span>
                <Badge content={count} color="default" size="sm">
                  <span></span>
                </Badge>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Hook pour intégrer facilement les notifications dans les composants
export function useQuickNotifications() {
  const { addNotification } = useAdvancedNotifications();

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

    message: (title: string, message?: string, fromUser?: any) => 
      addNotification({
        type: 'message',
        title,
        message,
        category: 'communication',
        priority: 'medium',
        fromUser
      }),

    incident: (title: string, message?: string, projectId?: number) => 
      addNotification({
        type: 'incident',
        title,
        message,
        category: 'project',
        priority: 'high',
        actionRequired: true,
        relatedId: projectId
      }),

    critical: (title: string, message?: string) => 
      addNotification({
        type: 'system',
        title,
        message,
        category: 'security',
        priority: 'critical',
        persistent: true
      })
  };
}