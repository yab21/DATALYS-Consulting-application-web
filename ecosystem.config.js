module.exports = {
  apps: [
    {
      name: "datalys-app",
      script: "npm",
      args: "start",
      cwd: "/var/www/datalys-app/current",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/www/datalys-app/shared/logs/pm2-error.log",
      out_file: "/var/www/datalys-app/shared/logs/pm2-out.log",
      log_file: "/var/www/datalys-app/shared/logs/pm2-combined.log",
      time: true,
      max_memory_restart: "1G",
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      ignore_watch: ["node_modules", "logs", ".next/cache"],
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
