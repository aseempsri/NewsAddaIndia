const jwt = require('jsonwebtoken');

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    if (decoded.username === 'admin') {
      req.user = decoded;
      next();
    } else {
      return res.status(403).json({ error: 'Admin access required' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateAdmin };

