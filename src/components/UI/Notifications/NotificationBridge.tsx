'use client';

import { useEffect, useCallback } from 'react';
import { useAdvancedNotifications } from '@/components/UI/Notifications/AdvancedNotificationProvider';
import { useSSE } from '@/hooks/useSSE';
import { SSENotification } from '@/services/sse-service';

/**
 * Pont logique entre le service SSE backend et le AdvancedNotificationProvider.
 *
 * Ce composant se connecte au flux SSE et ajoute les nouvelles notifications
 * au provider pour qu'elles apparaissent dans la cloche.
 */
export default function NotificationBridge() {
  const { addNotification, notifications } = useAdvancedNotifications();

  const handleNotification = useCallback((sseNotification: SSENotification) => {
    // Vérifier si la notification existe déjà
    const exists = notifications.some(n =>
      n.metadata?.backendId === sseNotification.id
    );

    if (!exists) {
      addNotification({
        type: mapType(sseNotification.type),
        title: sseNotification.title,
        message: sseNotification.description,
        priority: mapPriority(sseNotification.priority),
        category: mapCategory(sseNotification.type),
        actionRequired: sseNotification.type === 'incident' || sseNotification.type === 'support',
        relatedId: sseNotification.project_id || sseNotification.id,
        metadata: {
          backendId: sseNotification.id,
          status: sseNotification.status,
          parentId: sseNotification.parent_id,
          projectId: sseNotification.project_id,
          threadTicketNumber: sseNotification.thread_ticket_number
        }
      });
    }
  }, [addNotification, notifications]);

  // Se connecter au SSE
  useSSE({
    autoConnect: true,
    onNotification: handleNotification
  });

  return null;
}

// Helpers de mapping
function mapType(backendType: SSENotification['type']): 'success' | 'error' | 'warning' | 'info' | 'message' | 'incident' | 'system' {
  switch (backendType) {
    case 'message': return 'message';
    case 'support': return 'incident';
    case 'notification': return 'info';
    case 'incident': return 'incident';
    default: return 'info';
  }
}

function mapPriority(backendPriority: SSENotification['priority']): 'low' | 'medium' | 'high' | 'critical' {
  switch (backendPriority) {
    case 'critique': return 'critical';
    case 'haute': return 'high';
    case 'moyenne': return 'medium';
    case 'basse': return 'low';
    default: return 'medium';
  }
}

function mapCategory(backendType: SSENotification['type']): 'general' | 'project' | 'security' | 'system' | 'communication' {
  switch (backendType) {
    case 'message': return 'communication';
    case 'support': return 'project';
    case 'notification': return 'system';
    case 'incident': return 'project';
    default: return 'general';
  }
}
