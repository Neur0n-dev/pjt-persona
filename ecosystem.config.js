module.exports = {
  apps: [
    {
      name: 'persona',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/_pjt/persona',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3020,
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
}