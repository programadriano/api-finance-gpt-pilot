const jwt = require('jsonwebtoken');
require('dotenv').config();

// Using environment variable for the secret key
const secretKey = process.env.JWT_SECRET_KEY;

const generateToken = (payload, expiresIn = '1h') => {
  try {
    const token = jwt.sign(payload, secretKey, { expiresIn });
    console.log('Token generated successfully.');
    return token;
  } catch (error) {
    console.error('Error generating token:', error.message, error.stack);
    throw error;
  }
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, secretKey);
    console.log('Token verified successfully.');
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error.message, error.stack);
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};