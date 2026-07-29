const express = require('express');
const multer = require('multer');
const path = require('node:path');
const crypto = require('node:crypto');
const { readTasks, writeTaskRow, appendActivity } = require('../utils/sheetRepo');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.xlsx', '.xls', '.csv', '.zip']);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  },
});

function isOwnTask(task, user) {
  const dev = (task.developer || '').trim().toLowerCase();
  return (
    dev === (user.fullName || '').trim().toLowerCase() ||
    dev === (user.username || '').trim().toLowerCase()
  );
}

router.post('/:rowNumber/attachment', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const rowNumber = Number(req.params.rowNumber);
    const tasks = await readTasks();
    const existing = tasks.find((t) => t.rowNumber === rowNumber);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'Admin' && !isOwnTask(existing, req.user)) {
      return res.status(403).json({ message: 'Not your task' });
    }

    const attachmentUrl = `/uploads/${req.file.filename}`;
    const updated = {
      ...existing,
      attachmentUrl,
      lastUpdatedBy: req.user.fullName || req.user.username,
      lastUpdatedAt: new Date().toISOString(),
    };
    await writeTaskRow(rowNumber, updated);
    await appendActivity({
      timestamp: new Date().toISOString(),
      user: req.user.fullName || req.user.username,
      apiName: existing.apiName,
      field: 'attachment',
      oldValue: existing.attachmentUrl,
      newValue: attachmentUrl,
      remarks: `Uploaded ${req.file.originalname}`,
    });

    res.json({ attachmentUrl, task: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
