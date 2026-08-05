const express = require('express');
const { readEmailAuditLog } = require('../utils/sheetRepo');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 200;
    const log = await readEmailAuditLog(limit);
    res.json({ log });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
