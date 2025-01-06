const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

const authenticateAndAuthorize = (roles) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Token not provided.' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        console.error('JWT Error:', err.message);
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }

      req.user = decoded;

      const userRole = req.user?.rol;
      if (!userRole) {
        return res.status(403).json({ message: 'Access denied: No role information found in token.' });
      }

      if (!roles.includes(userRole)) {
        console.warn(`Unauthorized access attempt. Role: ${userRole}`);
        return res.status(403).json({ message: 'Access denied: You do not have the necessary permissions.' });
      }

      next();
    });
  };
};

module.exports = authenticateAndAuthorize;
