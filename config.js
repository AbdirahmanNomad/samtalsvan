require('dotenv').config();

const crypto = require('crypto');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    createCallMax: parseInt(process.env.RATE_LIMIT_CREATE_CALL_MAX, 10) || 10,
    contactMax: parseInt(process.env.RATE_LIMIT_CONTACT_MAX, 10) || 20,
    gdprMax: parseInt(process.env.RATE_LIMIT_GDPR_MAX, 10) || 5
  },
  
  security: {
    sessionSecret: process.env.SESSION_SECRET || crypto.randomUUID(),
    jwtSecret: process.env.JWT_SECRET || crypto.randomUUID()
  }
};

function getIceServers() {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];
  
  if (process.env.OPENRELAY_ENABLED === 'true' && process.env.OPENRELAY_API_KEY) {
    const ttl = 86400;
    const timestamp = Math.floor(Date.now() / 1000) + ttl;
    const username = `${timestamp}:${process.env.OPENRELAY_API_KEY}`;
    
    servers.push(
      { urls: 'turn:openrelay.metered.ca:80', username, credential: process.env.OPENRELAY_API_KEY },
      { urls: 'turn:openrelay.metered.ca:443', username, credential: process.env.OPENRELAY_API_KEY },
      { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username, credential: process.env.OPENRELAY_API_KEY }
    );
  }
  
  if (process.env.TURN_SERVERS) {
    process.env.TURN_SERVERS.split(',').forEach(s => {
      const [url, username, credential] = s.split('|');
      if (url) {
        servers.push({
          urls: url.trim(),
          username: username || process.env.TURN_USERNAME || '',
          credential: credential || process.env.TURN_CREDENTIAL || ''
        });
      }
    });
  }
  
  return servers;
}

function validateEnv() {
  if (process.env.NODE_ENV === 'production') {
    const required = ['BASE_URL'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
  }
}

module.exports = { config, getIceServers, validateEnv };
