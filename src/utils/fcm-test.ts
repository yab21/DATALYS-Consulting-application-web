// Test direct de l'API FCM backend
export async function testFCMBackend() {
  const token = localStorage.getItem('authToken');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082';
  
  console.log('🧪 Test FCM Backend...');
  console.log('📍 API Base:', apiBase);
  console.log('🔑 Token:', token ? 'Présent' : 'Manquant');
  
  // 1. Vérifier si le token FCM est bien stocké côté backend
  try {
    const checkResponse = await fetch(`${apiBase}/fcm/check-tokens`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🔍 Check tokens response:', checkResponse.status);
    if (checkResponse.ok) {
      const data = await checkResponse.json();
      console.log('📱 Tokens stockés:', data);
    }
  } catch (error) {
    console.log('❌ Erreur check tokens:', error);
  }
  
  // 2. Test d'envoi direct d'une notification
  try {
    const testResponse = await fetch(`${apiBase}/fcm/test-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test FCM',
        body: 'Notification de test depuis le frontend',
        target: 'admins'
      })
    });
    
    console.log('🚀 Test notification response:', testResponse.status);
    const data = await testResponse.json();
    
    if (testResponse.ok) {
      console.log('✅ Test notification result:', data);
    } else {
      console.log('❌ Test notification error:', data);
    }
    
    // Détails de l'erreur 500
    if (data.code === 500) {
      console.log('🔍 Détails erreur 500:', data.message);
      console.log('🔍 Data erreur:', data.data);
    }
  } catch (error) {
    console.log('❌ Erreur test notification:', error);
  }
}

// Test d'envoi d'un message haute priorité pour déclencher FCM
export async function testHighPriorityMessage() {
  const token = localStorage.getItem('authToken');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082';
  
  console.log('📨 Test message haute priorité...');
  
  try {
    const response = await fetch(`${apiBase}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test FCM - Message HAUTE priorité',
        description: 'Ce message devrait déclencher une notification push automatique',
        priority: 'haute',
        project_id: 1
      })
    });
    
    console.log('📨 Message response:', response.status);
    const data = await response.json();
    console.log('📨 Message result:', data);
    
    if (data.code === 200) {
      console.log('✅ Message envoyé - vérifiez si la notification FCM arrive dans 5 secondes...');
    }
    
  } catch (error) {
    console.log('❌ Erreur envoi message:', error);
  }
}

// Test du flux complet - Envoyer message haute priorité et écouter la notification
export async function testCompleteFCMFlow() {
  console.log('🧪 Test flux complet FCM...');
  
  // 1. Vérifier le statut FCM via import
  try {
    const { fcmService } = await import('@/services/fcm');
    const fcmStatus = fcmService.isSupported();
    console.log('📱 FCM supporté:', fcmStatus);
    
    // 2. Vérifier le token
    const token = fcmService.getCurrentToken();
    console.log('🔑 Token FCM:', token ? `Présent (${token.substring(0, 20)}...)` : 'Absent');
    
    // 3. Vérifier les permissions
    const permission = fcmService.getPermissionStatus();
    console.log('🔐 Permission notifications:', permission);
    
  } catch (error) {
    console.error('❌ Erreur accès FCM service:', error);
  }
  
  // 4. Tester l'API backend
  console.log('🚀 Test API backend FCM...');
  await testFCMBackend();
  
  // 5. Envoyer un vrai message haute priorité
  console.log('📨 Envoi message haute priorité...');
  await testHighPriorityMessage();
  
  console.log('⏳ Attendez 5-10 secondes pour la notification...');
  console.log('👀 Surveillez la console pour les logs FCM:');
  console.log('   - 🚨 FCM Message reçu en premier plan');
  console.log('   - 🔔 Notification convertie pour l\'UI');
  console.log('   - ✅ Notification ajoutée au système UI');
}

// Vérifier si on reçoit des notifications en temps réel
export function startFCMMonitoring() {
  console.log('📡 Démarrage monitoring FCM...');
  
  // Surveiller les événements FCM
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('🔔 Message du service worker:', event.data);
    });
  }
  
  // Surveiller les événements personnalisés
  window.addEventListener('fcm-notification-clicked', (event) => {
    console.log('👆 Notification FCM cliquée:', event);
  });
  
  window.addEventListener('fcm-notification-closed', (event) => {
    console.log('❌ Notification FCM fermée:', event);
  });
  
  console.log('✅ Monitoring FCM actif - surveillez les logs');
}

// Test pour vérifier si le token admin est bien stocké côté backend
export async function checkAdminTokens() {
  const token = localStorage.getItem('authToken');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082';
  
  console.log('🔍 Vérification des tokens admin...');
  
  try {
    // Obtenir le token FCM local
    const { fcmService } = await import('@/services/fcm');
    const fcmToken = fcmService.getCurrentToken();
    console.log('🔑 Notre token FCM:', fcmToken ? `${fcmToken.substring(0, 30)}...` : 'Absent');
    
    // Vérifier si il est bien enregistré côté backend
    // (Note: l'endpoint check-tokens peut ne pas exister)
    console.log('📡 Test si notre token est connu du backend...');
    
    // Envoyer une notification de test directement à notre token
    const testResponse = await fetch(`${apiBase}/fcm/test-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Test Direct Token',
        body: 'Test de notification directe vers votre token',
        target: 'current_user'  // Cibler l'utilisateur actuel
      })
    });
    
    const data = await testResponse.json();
    console.log('🎯 Test notification directe:', data);
    
    if (data.code === 200) {
      console.log('✅ Notification de test envoyée - vérifiez si vous la recevez');
    } else {
      console.log('❌ Échec notification directe:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur check tokens admin:', error);
  }
}

// Test de régénération forcée du token
export async function forceRegenerateToken() {
  console.log('🔄 Test de régénération forcée du token...');
  
  try {
    const { fcmService } = await import('@/services/fcm');
    
    // Forcer la régénération
    const newToken = await fcmService.forceTokenRegeneration();
    
    if (newToken) {
      console.log('✅ Token régénéré avec succès:', newToken.substring(0, 30) + '...');
      
      // Envoyer le nouveau token au serveur
      const authToken = localStorage.getItem('authToken');
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082';
      
      const response = await fetch(`${apiBase}/fcm/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: newToken,
          user_id: 1, // ou récupérer depuis le contexte utilisateur
          device_info: {
            userAgent: navigator.userAgent,
            platform: (navigator as any).userAgentData?.platform || (navigator as any).platform || 'unknown',
            language: navigator.language
          }
        })
      });
      
      if (response.ok) {
        console.log('✅ Nouveau token envoyé au serveur avec succès');
        
        // Tester immédiatement avec le nouveau token
        console.log('🚀 Test avec le nouveau token...');
        await testFCMBackend();
        
      } else {
        console.error('❌ Erreur envoi nouveau token:', response.status);
      }
      
    } else {
      console.error('❌ Échec de la régénération du token');
    }
    
  } catch (error) {
    console.error('❌ Erreur régénération token:', error);
  }
}

// Ajouter au window pour accès depuis la console
if (typeof window !== 'undefined') {
  (window as any).testFCM = testFCMBackend;
  (window as any).testHighPriorityMessage = testHighPriorityMessage;
  (window as any).testCompleteFCMFlow = testCompleteFCMFlow;
  (window as any).startFCMMonitoring = startFCMMonitoring;
  (window as any).checkAdminTokens = checkAdminTokens;
  (window as any).forceRegenerateToken = forceRegenerateToken;
}