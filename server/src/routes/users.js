const express = require('express');
const { z } = require('zod');
const { readUsers, appendUser, writeUserRow, deleteUserRow } = require('../utils/sheetRepo');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function sanitize(user) {
  const { password, ...rest } = user;
  return rest;
}

router.get('/', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const users = await readUsers();
    res.json({ users: users.map(sanitize) });
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(4),
  role: z.enum(['Admin', 'Developer']),
  fullName: z.string().min(1),
  email: z.string().email().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

router.post('/', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0]?.message || 'Invalid input' });
    }
    const users = await readUsers();
    const exists = users.some(
      (u) => u.username.trim().toLowerCase() === parsed.data.username.trim().toLowerCase()
    );
    if (exists) return res.status(409).json({ message: 'Username already exists' });

    await appendUser(parsed.data);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    next(err);
  }
});

router.put('/:rowNumber', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    const users = await readUsers();
    const existing = users.find((u) => u.rowNumber === rowNumber);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    const updated = { ...existing, ...req.body };
    if (!req.body.password) updated.password = existing.password;

    await writeUserRow(rowNumber, updated);
    res.json({ message: 'User updated' });
  } catch (err) {
    next(err);
  }
});

router.post('/:rowNumber/reset-password', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }
    const users = await readUsers();
    const existing = users.find((u) => u.rowNumber === rowNumber);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    await writeUserRow(rowNumber, { ...existing, password });
    res.json({ message: 'Password reset' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:rowNumber', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    await deleteUserRow(rowNumber);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
