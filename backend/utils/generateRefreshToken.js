const jwt = require('jsonwebtoken');

const generateRefreshToken = (id) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
};

module.exports = generateRefreshToken;