const jwt = require('jsonwebtoken');
const config = require('../config/env');

const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    config.jwtRefreshSecret,
    {
      expiresIn: '7d',
    }
  );
};

module.exports = generateRefreshToken;
