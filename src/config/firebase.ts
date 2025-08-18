// Configuration Firebase pour FCM
// Ces valeurs doivent être remplacées par les vraies valeurs de configuration Firebase

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "datalys-consulting",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id"
};

export const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "your-vapid-key";

// Vérifier si la configuration est complète
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey !== "your-api-key" &&
    firebaseConfig.authDomain !== "your-auth-domain" &&
    firebaseConfig.projectId !== "datalys-consulting" &&
    firebaseConfig.storageBucket !== "your-storage-bucket" &&
    firebaseConfig.messagingSenderId !== "your-sender-id" &&
    firebaseConfig.appId !== "your-app-id" &&
    vapidKey !== "your-vapid-key"
  );
};

// Configuration pour le mode développement
export const isDevelopment = process.env.NODE_ENV === 'development';

// URL de l'API pour envoyer les tokens FCM
export const FCM_TOKEN_ENDPOINT = process.env.NEXT_PUBLIC_API_URL + '/users/fcm-token' || '/api/users/fcm-token';