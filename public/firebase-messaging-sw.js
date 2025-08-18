// Firebase Cloud Messaging Service Worker
// Ce fichier doit être dans le répertoire public pour être accessible par le navigateur

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuration Firebase 
// Note: Les variables d'environnement ne sont pas disponibles dans le service worker
// La configuration doit être fournie par le client ou codée en dur
const firebaseConfig = {
  apiKey: "your-api-key", // À remplacer par la vraie valeur
  authDomain: "your-auth-domain", // À remplacer
  projectId: "datalys-consulting", // À remplacer
  storageBucket: "your-storage-bucket", // À remplacer
  messagingSenderId: "your-sender-id", // À remplacer
  appId: "your-app-id" // À remplacer
};

// Vérifier si la configuration est définie
const isConfigured = Object.values(firebaseConfig).every(value => 
  value !== "your-api-key" && 
  value !== "your-auth-domain" && 
  value !== "your-storage-bucket" && 
  value !== "your-sender-id" && 
  value !== "your-app-id"
);

// Initialiser Firebase seulement si configuré
if (isConfigured) {
  firebase.initializeApp(firebaseConfig);
  
  // Récupérer l'instance de messaging
  const messaging = firebase.messaging();
} else {
  console.warn('Firebase non configuré dans le service worker');
}

// Gérer les messages en arrière-plan (seulement si Firebase est configuré)
if (isConfigured && typeof messaging !== 'undefined') {
  messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

  const notificationTitle = payload.notification?.title || 'DATALYS Consulting';
  const notificationOptions = {
    body: payload.notification?.body || 'Nouvelle notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.id || 'notification',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/dismiss.png'
      }
    ],
    requireInteraction: payload.data?.priority === 'critical',
    silent: false,
    timestamp: Date.now(),
    vibrate: [200, 100, 200],
    renotify: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
}

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Clic sur notification:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  notification.close();

  if (action === 'dismiss') {
    return;
  }

  // Action par défaut ou action 'view'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Vérifier si l'application est déjà ouverte
        for (const client of clientList) {
          if (client.url.includes('/tableaudebord') && 'focus' in client) {
            // Envoyer les données de notification à l'application
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data
            });
            return client.focus();
          }
        }

        // Ouvrir une nouvelle fenêtre si l'application n'est pas ouverte
        let targetUrl = '/tableaudebord';
        
        // Déterminer l'URL de destination selon le type de notification
        if (data) {
          switch (data.type) {
            case 'message':
              targetUrl = '/tableaudebord/messages';
              break;
            case 'incident':
              targetUrl = '/tableaudebord/incidents';
              break;
            case 'project':
              targetUrl = data.project_id ? `/tableaudebord/projet/${data.project_id}` : '/tableaudebord/projet';
              break;
            case 'support':
              targetUrl = '/tableaudebord/support';
              break;
            default:
              targetUrl = '/tableaudebord';
          }
        }

        return clients.openWindow(targetUrl);
      })
  );
});

// Gérer la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification fermée:', event);
  
  const data = event.notification.data;
  
  // Envoyer l'information à l'application si elle est ouverte
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/tableaudebord')) {
            client.postMessage({
              type: 'NOTIFICATION_CLOSED',
              data: data
            });
            break;
          }
        }
      })
  );
});

// Gérer l'installation du service worker
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installé');
  self.skipWaiting();
});

// Gérer l'activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activé');
  event.waitUntil(self.clients.claim());
});

// Gérer les messages du client
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message reçu du client:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});