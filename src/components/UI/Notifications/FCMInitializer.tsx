'use client';

import React, { useEffect } from 'react';
import { useFCMIntegration } from '@/hooks/useFCMIntegration';

/**
 * Composant invisible qui initialise FCM automatiquement
 * À placer dans le layout principal pour s'assurer que FCM est initialisé
 * dès que l'utilisateur est connecté
 */
export default function FCMInitializer() {
  const { fcmStatus } = useFCMIntegration();

  useEffect(() => {
    // Log du statut FCM pour le debug
    if (process.env.NODE_ENV === 'development') {
      console.log('FCM Status:', fcmStatus);
    }
  }, [fcmStatus]);

  // Ce composant n'affiche rien, il initialise juste FCM en arrière-plan
  return null;
}