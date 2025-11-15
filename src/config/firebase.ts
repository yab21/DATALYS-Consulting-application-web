// Configuration Firebase pour FCM
// Ces valeurs doivent être remplacées par les vraies valeurs de configuration Firebase

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!
};

export const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;

// Vérifier si la configuration est complète
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey !== "your-api-key" &&
    firebaseConfig.authDomain !== "your-auth-domain" &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket !== "your-storage-bucket" &&
    firebaseConfig.messagingSenderId !== "your-sender-id" &&
    firebaseConfig.appId !== "your-app-id" &&
    vapidKey !== "your-vapid-key"
  );
};

// Configuration pour le mode développement
export const isDevelopment = process.env.NODE_ENV === 'development';

// URL de l'API pour envoyer les tokens FCM (selon la documentation)
export const FCM_TOKEN_ENDPOINT = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api') + '/fcm/register-token';