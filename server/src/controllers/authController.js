const authService = require('../services/authService');

async function register(req, res) {
  const { name, email, password } = req.body;
  // Never accept role/userId from client (mass-assignment protection)
  const result = await authService.register({ name, email, password });
  res.status(201).json({ success: true, data: result });
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.json({ success: true, data: result });
}

async function me(req, res) {
  res.json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, me };
