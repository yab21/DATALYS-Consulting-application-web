#!/usr/bin/env node

// Script de vérification de la configuration FCM
// Usage: node scripts/check-fcm-config.js

const fs = require('fs');
const path = require('path');

// Lire le fichier .env manuellement
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

console.log('🔍 Vérification de la configuration Firebase/FCM...\n');

const config = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDmjct6e2ZuZhnhFeVRCFIoInuHSYMPoVg",
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "datalys-consulting-backend.firebaseapp.com",
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "datalys-consulting-backend",
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "datalys-consulting-backend.firebasestorage.app",
  messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "838991252517",
  appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID || "1:838991252517:web:98558f13b6b88f60cc43cc",
  measurementId: envVars.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9YTTE18502",
  vapidKey: envVars.NEXT_PUBLIC_FIREBASE_VAPID_KEY
};

// Vérifications
const checks = [
  { name: 'API Key', value: config.apiKey, test: (v) => v && v.startsWith('AIza') },
  { name: 'Auth Domain', value: config.authDomain, test: (v) => v && v.includes('.firebaseapp.com') },
  { name: 'Project ID', value: config.projectId, test: (v) => v === 'datalys-consulting-backend' },
  { name: 'Storage Bucket', value: config.storageBucket, test: (v) => v && v.includes('.firebasestorage.app') },
  { name: 'Messaging Sender ID', value: config.messagingSenderId, test: (v) => v === '838991252517' },
  { name: 'App ID', value: config.appId, test: (v) => v && v.includes('web:') },
  { name: 'Measurement ID', value: config.measurementId, test: (v) => v && v.startsWith('G-') },
  { name: 'VAPID Key', value: config.vapidKey, test: (v) => v && v.length > 80 && v.startsWith('B') }
];

let allPassed = true;

checks.forEach(check => {
  const passed = check.test(check.value);
  const status = passed ? '✅' : '❌';
  const display = check.name === 'VAPID Key' && check.value 
    ? `${check.value.substring(0, 20)}...` 
    : check.value || 'Non défini';
  
  console.log(`${status} ${check.name}: ${display}`);
  
  if (!passed) {
    allPassed = false;
  }
});

console.log('\n📊 Résumé:');

if (allPassed) {
  console.log('🎉 Configuration Firebase/FCM complète et valide !');
  console.log('✅ Les notifications push sont prêtes à fonctionner');
  console.log('🚀 Vous pouvez maintenant tester les notifications FCM');
} else {
  console.log('⚠️  Configuration incomplète ou incorrecte');
  console.log('🔧 Vérifiez les valeurs marquées en erreur ci-dessus');
}

console.log('\n📝 Étapes suivantes:');
console.log('1. Redémarrez l\'application si vous avez modifié .env');
console.log('2. Testez les notifications depuis l\'interface FCM Settings');
console.log('3. Vérifiez que les tokens FCM sont bien envoyés au backend');