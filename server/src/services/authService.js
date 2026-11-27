const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister({ name, email, password }) {
  if (!name || !name.trim()) {
    const e = new Error('Name is required.');
    e.statusCode = 400;
    throw e;
  }
  if (!email || !EMAIL_RE.test(email)) {
    const e = new Error('Please enter a valid email address.');
    e.statusCode = 400;
    throw e;
  }
  if (!password || password.length < 8) {
    const e = new Error('Password must be at least 8 characters long.');
    e.statusCode = 400;
    throw e;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    const e = new Error('Password must include at least one letter and one number.');
    e.statusCode = 400;
    throw e;
  }
}

async function register({ name, email, password }) {
  validateRegister({ name, email, password });
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const e = new Error('Email is already registered.');
    e.statusCode = 409;
    throw e;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return { user, token: signToken(user.id) };
}

async function login({ email, password }) {
  if (!email || !password) {
    const e = new Error('Email and password are required.');
    e.statusCode = 400;
    throw e;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    const e = new Error('Invalid email or password.');
    e.statusCode = 401;
    throw e;
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const e = new Error('Invalid email or password.');
    e.statusCode = 401;
    throw e;
  }
  const safe = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
  return { user: safe, token: signToken(user.id) };
}

module.exports = { register, login };
