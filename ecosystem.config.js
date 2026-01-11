module.exports = {
  apps: [
    {
      name: "datalys-app",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      exec_mode: "cluster",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 3000,
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      min_uptime: "5s",
      max_restarts: 15,
      autorestart: true,
      node_args: "--max_old_space_size=512",
      env_file: ".env",
    },
  ],
};
