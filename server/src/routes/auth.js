const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { readUsers } = require('../utils/sheetRepo');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

async function passwordMatches(inputPassword, storedPassword) {
  if (typeof storedPassword === 'string' && storedPassword.startsWith('$2')) {
    return bcrypt.compare(inputPassword, storedPassword);
  }
  return inputPassword === storedPassword;
}

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const { username, password } = parsed.data;

    const users = await readUsers();
    const user = users.find(
      (u) => (u.username || '').trim().toLowerCase() === username.trim().toLowerCase()
    );

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if ((user.status || 'Active').toLowerCase() === 'inactive') {
      return res.status(403).json({ message: 'This account has been disabled' });
    }

    const ok = await passwordMatches(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = {
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
