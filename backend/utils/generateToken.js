const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    config.jwtSecret,
    {
      expiresIn: '15m',
    }
  );
};

module.exports = generateToken;
