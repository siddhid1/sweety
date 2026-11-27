const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const prisma = require('../config/prisma');

function signToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

module.exports = { signToken, authMiddleware };
