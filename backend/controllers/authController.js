const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateRefreshToken = require('../utils/generateRefreshToken');

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: 'Please add all fields',
    });
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({
      message: 'User already exists',
    });
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: accessToken,
    });
  }

  return res.status(400).json({
    message: 'Invalid user data',
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({
      message: 'Invalid email or password',
    });
  }

  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  setRefreshTokenCookie(res, refreshToken);

  return res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: accessToken,
  });
};

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: 'Refresh token not found',
    });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
      });
    }

    const newAccessToken = generateToken(user._id);

    return res.json({
      token: newAccessToken,
    });
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired refresh token',
    });
  }
};

const logoutUser = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.json({
    message: 'Logged out successfully',
  });
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};