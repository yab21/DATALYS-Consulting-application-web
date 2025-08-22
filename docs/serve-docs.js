#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const DOCS_DIR = __dirname;

// Types MIME
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Gestion des URLs
  let filePath = path.join(DOCS_DIR, req.url === '/' ? 'DOCUMENTATION_COMPLETE.html' : req.url);
  
  // Extension du fichier
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Page 404 personnalisée
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>404 - Page non trouvée</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #4ba9b7; }
              a { color: #4ba9b7; text-decoration: none; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>🚀 Documentation DATALYS Consulting</h1>
            <h2>Page non trouvée</h2>
            <p><a href="/">← Retour à la documentation</a></p>
          </body>
          </html>
        `);
      } else {
        res.writeHead(500);
        res.end('Erreur serveur: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`
  🚀 Serveur de documentation DATALYS Consulting démarré !
  
  📖 Documentation complète : http://localhost:${PORT}
  📱 Guide utilisateur      : http://localhost:${PORT}/GUIDE_UTILISATEUR.md
  
  ✨ La documentation est maintenant accessible dans votre navigateur.
  🔄 Appuyez sur Ctrl+C pour arrêter le serveur.
  `);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur de documentation...');
  server.close(() => {
    console.log('✅ Serveur fermé proprement.');
    process.exit(0);
  });
});