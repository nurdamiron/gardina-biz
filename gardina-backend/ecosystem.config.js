// PM2 Configuration for Production
// https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'gardina-backend',
      script: './src/server.js',
      instances: 2, // Run 2 instances for load balancing
      exec_mode: 'cluster',

      // Environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Restart policy
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced features
      watch: false, // Don't watch in production
      ignore_watch: ['node_modules', 'logs', 'coverage'],

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'YOUR_EC2_IP_HERE',
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPO_URL_HERE',
      path: '/home/ubuntu/gardina-backend',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};
