'use client';

import { useIntegratedNotifications } from '@/hooks/useIntegratedNotifications';

/**
 * Pont logique entre le service de polling backend (realtimeNotificationService)
 * et le AdvancedNotificationProvider.
 *
 * Ce composant doit être monté à l'intérieur du AdvancedNotificationProvider
 * pour que useIntegratedNotifications() puisse alimenter le store de notifications.
 */
export default function NotificationBridge() {
  useIntegratedNotifications();
  return null;
}
