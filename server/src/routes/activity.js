const express = require('express');
const { readActivity } = require('../utils/sheetRepo');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 200;
    let items = await readActivity(limit);

    if (req.user.role !== 'Admin') {
      const name = (req.user.fullName || req.user.username || '').trim().toLowerCase();
      items = items.filter((a) => (a.user || '').trim().toLowerCase() === name);
    }

    res.json({ activity: items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
