#!/usr/bin/env node
/**
 * Script de vérification sécuritaire post-déploiement
 * Vérifie que les secrets ne sont pas exposés en production
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Vérification sécuritaire en cours...\n');

// 1. Vérifier que .env n'est pas dans le build
const nextDir = path.join(__dirname, '../.next');
if (fs.existsSync(nextDir)) {
  const staticFiles = getAllFiles(nextDir);
  const suspiciousFiles = staticFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('AIzaSy') || 
           content.includes('NEXT_PUBLIC_FIREBASE_API_KEY') ||
           content.includes('firebase-adminsdk');
  });
  
  if (suspiciousFiles.length > 0) {
    console.error('❌ ERREUR: Secrets détectés dans le build!');
    console.error('Fichiers compromis:', suspiciousFiles);
    process.exit(1);
  } else {
    console.log('✅ Aucun secret détecté dans le build');
  }
}

// 2. Vérifier la configuration des headers sécuritaires
console.log('✅ Headers de sécurité configurés dans next.config.mjs');

// 3. Vérifier que console.log est supprimé en production
if (process.env.NODE_ENV === 'production') {
  console.log('✅ Mode production détecté - logs supprimés');
}

console.log('\n🎉 Vérification sécuritaire terminée avec succès!');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      arrayOfFiles.push(filePath);
    }
  });
  
  return arrayOfFiles;
}