// Configuration Firebase pour FCM
// Ces valeurs doivent être remplacées par les vraies valeurs de configuration Firebase

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDmjct6e2ZuZhnhFeVRCFIoInuHSYMPoVg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "datalys-consulting-backend.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "datalys-consulting-backend",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "datalys-consulting-backend.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "838991252517",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:838991252517:web:98558f13b6b88f60cc43cc",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9YTTE18502"
};

export const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "your-vapid-key-from-firebase-console";

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
export const FCM_TOKEN_ENDPOINT = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://82.112.253.137:8082') + '/fcm/register-token';