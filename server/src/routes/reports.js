const express = require('express');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { readTasks, readUsers } = require('../utils/sheetRepo');
const { computeBreach } = require('../utils/breach');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 1000) / 10;
}

async function buildReport() {
  const [tasks, users] = await Promise.all([readTasks(), readUsers()]);
  const developers = users.filter((u) => u.role === 'Developer');

  return developers.map((dev) => {
    const name = (dev.fullName || dev.username || '').trim();
    const devTasks = tasks.filter(
      (t) => (t.developer || '').trim().toLowerCase() === name.toLowerCase()
    );
    const completed = devTasks.filter((t) => t.apiStatus === 'Completed').length;
    const pending = devTasks.length - completed;
    const breached = devTasks.filter(
      (t) =>
        computeBreach(t.apiDate, t.apiStatus).breached ||
        computeBreach(t.deploymentDate, t.deploymentStatus).breached ||
        computeBreach(t.mobileIntegrationDate, t.mobileStatus).breached ||
        computeBreach(t.webIntegrationDate, t.webStatus).breached
    ).length;
    const deploymentDone = devTasks.filter((t) => t.deploymentStatus === 'Completed').length;
    const mobileDone = devTasks.filter((t) => t.mobileStatus === 'Completed').length;
    const webDone = devTasks.filter((t) => t.webStatus === 'Completed').length;

    return {
      developer: name,
      total: devTasks.length,
      pending,
      completed,
      breached,
      deploymentProgressPct: pct(deploymentDone, devTasks.length),
      mobileProgressPct: pct(mobileDone, devTasks.length),
      webProgressPct: pct(webDone, devTasks.length),
      completionPct: pct(completed, devTasks.length),
    };
  });
}

router.get('/', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const report = await buildReport();
    res.json({ report });
  } catch (err) {
    next(err);
  }
});

router.get('/excel', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const report = await buildReport();
    const ws = XLSX.utils.json_to_sheet(report);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Developer Report');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="developer-report.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/pdf', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const report = await buildReport();
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Disposition', 'attachment; filename="developer-report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Developer Wise Report', { align: 'center' });
    doc.moveDown();

    const headers = ['Developer', 'Total', 'Pending', 'Completed', 'Breached', 'Deploy %', 'Mobile %', 'Web %', 'Completion %'];
    const colWidths = [140, 60, 70, 80, 70, 70, 70, 70, 90];
    let y = doc.y;
    let x = doc.x;

    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i] });
      x += colWidths[i];
    });

    doc.moveDown();
    doc.font('Helvetica');

    report.forEach((r) => {
      y = doc.y;
      x = doc.x;
      const row = [
        r.developer,
        r.total,
        r.pending,
        r.completed,
        r.breached,
        `${r.deploymentProgressPct}%`,
        `${r.mobileProgressPct}%`,
        `${r.webProgressPct}%`,
        `${r.completionPct}%`,
      ];
      row.forEach((val, i) => {
        doc.text(String(val), x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
