const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure environment variables are loaded

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Access denied. No token provided.');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        console.error(`JWT verification error: ${err.message}`, err);
        return res.status(401).json({ message: 'Invalid token.' });
      }
      req.user = decoded; // Add decoded user payload to request object
      next();
    });
  } catch (error) {
    console.error(`Auth middleware error: ${error.message}`, error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
};

module.exports = authMiddleware;