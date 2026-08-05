const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { parse } = require('csv-parse/sync');
const PDFDocument = require('pdfkit');
const { readTasks, replaceAllTasks, appendActivity } = require('../utils/sheetRepo');
const { TASK_COLUMNS } = require('../config/schema');
const { isEverInvolved } = require('../utils/stages');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB max

const IMPORT_COLUMN_KEYS = TASK_COLUMNS.slice(0, 16).map((c) => c.key); // original A..P only

function rowsToTasks(rows) {
  return rows
    .filter((r) => r && r[1] && String(r[1]).trim() !== '') // must have API Name
    .map((r, i) => {
      const task = {};
      IMPORT_COLUMN_KEYS.forEach((key, idx) => {
        task[key] = r[idx] !== undefined && r[idx] !== null ? String(r[idx]) : '';
      });
      if (!task.serial) task.serial = i + 1;
      task.remarks = '';
      task.attachmentUrl = '';
      task.lastUpdatedBy = '';
      task.lastUpdatedAt = new Date().toISOString();
      return task;
    });
}

router.post('/import', requireAuth, requireRole('Admin'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const name = req.file.originalname.toLowerCase();
    let rows;

    if (name.endsWith('.csv')) {
      const records = parse(req.file.buffer.toString('utf8'), { skip_empty_lines: true });
      rows = records.slice(1);
    } else {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
      rows = records.slice(1);
    }

    const tasks = rowsToTasks(rows);
    if (tasks.length === 0) {
      return res.status(400).json({ message: 'No valid rows found in the file' });
    }

    await replaceAllTasks(tasks);
    await appendActivity({
      timestamp: new Date().toISOString(),
      user: req.user.fullName || req.user.username,
      apiName: '',
      field: 'import',
      oldValue: '',
      newValue: `Imported ${tasks.length} rows from ${req.file.originalname}`,
      remarks: '',
    });

    res.json({ message: `Imported ${tasks.length} tasks`, count: tasks.length });
  } catch (err) {
    next(err);
  }
});

router.get('/export/:format', requireAuth, async (req, res, next) => {
  try {
    const { format } = req.params;
    const all = await readTasks();
    const tasks = req.user.role === 'Admin' ? all : all.filter((t) => isEverInvolved(t, req.user));

    const header = TASK_COLUMNS.map((c) => c.header);
    const rows = tasks.map((t) => TASK_COLUMNS.map((c) => t[c.key] ?? ''));

    if (format === 'csv') {
      const { stringify } = require('csv-stringify/sync');
      const csv = stringify([header, ...rows]);
      res.setHeader('Content-Disposition', 'attachment; filename="api-tasks.csv"');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'API Tasks');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename="api-tasks.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Disposition', 'attachment; filename="api-tasks.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);
      doc.fontSize(16).text('API Task List', { align: 'center' });
      doc.moveDown();
      doc.fontSize(8);
      tasks.forEach((t) => {
        doc.text(
          `${t.serial}. ${t.apiName} | ${t.category} | ${t.phase} | ${t.developer} | Status: ${t.apiStatus} | Assigned: ${t.assignedDate || '-'} | API Date: ${t.apiDate}`
        );
      });
      doc.end();
      return;
    }

    res.status(400).json({ message: 'Unsupported format. Use csv, xlsx, or pdf.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
