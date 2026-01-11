module.exports = {
  apps: [
    {
      name: "datalys-app",
      script: "npm",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: "1G",
      restart_delay: 5000,
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      min_uptime: "10s",
      max_restarts: 3,
      autorestart: true,
      node_args: "--max_old_space_size=1024",
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
