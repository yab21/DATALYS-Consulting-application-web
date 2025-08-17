module.exports = {
  apps: [
    {
      name: "datalys-app",
      port: "3000",
      exec_mode: "cluster",
      instances: "max", // Utilise tous les CPU disponibles
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      // Surveillance et redémarrage automatique
      watch: false,
      max_memory_restart: "1G",
      restart_delay: 5000,

      // Logs
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Gestion des erreurs
      min_uptime: "10s",
      max_restarts: 10,

      // Variables d'environnement
      env_file: ".env",
    },
  ],

  deploy: {
    production: {
      user: "root",
      host: "82.112.253.137",
      ref: "origin/develop",
      repo: "git@github.com:yab21/DATALYS-Consulting-application-web.git",
      path: "/var/www/datalys-app",
      "pre-deploy-local": "",
      "post-deploy":
        "npm ci --only=production && npm run build && pm2 reload ecosystem.config.js --env production && pm2 save",
      "pre-setup": "",
      ssh_options: "StrictHostKeyChecking=no",
    },
  },
};
