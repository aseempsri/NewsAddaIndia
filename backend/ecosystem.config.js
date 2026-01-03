// PM2 Ecosystem Configuration File
// Usage: pm2 start ecosystem.config.js
// This provides better process management and monitoring

module.exports = {
  apps: [{
    name: 'news-adda-backend',
    script: './server.js',
    instances: 1, // Use 'max' for cluster mode (requires more resources)
    exec_mode: 'fork', // Use 'cluster' for multiple instances
    watch: false, // Set to true for development, false for production
    max_memory_restart: '500M', // Restart if memory exceeds 500MB
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Environment variables are loaded from .env file
    // Make sure .env file exists in the same directory
  }]
};

