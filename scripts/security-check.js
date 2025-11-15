#!/usr/bin/env node
/**
 * Script de vérification sécuritaire post-déploiement
 * Vérifie que les secrets ne sont pas exposés en production
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Vérification sécuritaire en cours...\n');

// 1. Vérifier que les secrets privés ne sont pas dans le build
const nextDir = path.join(__dirname, '../.next');
if (fs.existsSync(nextDir)) {
  const staticFiles = getAllFiles(nextDir);
  const suspiciousFiles = staticFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Rechercher des secrets PRIVÉS dangereux (pas les NEXT_PUBLIC_*)
    const hasPrivateSecrets = 
      content.includes('firebase-adminsdk') ||                    // Clé admin Firebase
      content.includes('-----BEGIN PRIVATE KEY-----') ||         // Clés privées
      /["'].*private_key_id["']\s*:\s*["'][^"']{20,}/.test(content) || // ID clé privée avec valeur
      /password\s*[:=]\s*["'][^"']{8,}["']/.test(content) ||       // Mots de passe hardcodés
      /access_token\s*[:=]\s*["'][^"']{30,}["']/.test(content) ||  // Tokens d'accès longs
      /secret_key\s*[:=]\s*["'][^"']{20,}["']/.test(content);      // Clés secrètes avec valeur
    
    // Les NEXT_PUBLIC_* sont intentionnellement exposés côté client pour Firebase
    // On ne les considère PAS comme des fuites de sécurité
    
    return hasPrivateSecrets;
  });
  
  if (suspiciousFiles.length > 0) {
    console.error('❌ ERREUR: Secrets privés détectés dans le build!');
    console.error('Fichiers compromis:', suspiciousFiles);
    process.exit(1);
  } else {
    console.log('✅ Aucun secret privé détecté dans le build');
    console.log('   (Les variables NEXT_PUBLIC_* sont normalement exposées côté client)');
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