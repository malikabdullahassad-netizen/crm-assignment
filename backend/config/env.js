const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crm-lead-manager',
  jwtSecret: process.env.JWT_SECRET || 'local-development-jwt-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'local-development-refresh-secret',
  nodeEnv,
  port: process.env.PORT || 5000,
  isProduction: nodeEnv === 'production',
};
