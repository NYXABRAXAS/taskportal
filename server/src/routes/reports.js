const express = require('express');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { readTasks, readUsers } = require('../utils/sheetRepo');
const { computeBreach } = require('../utils/breach');
const { matchesUser, stageOwnershipStats } = require('../utils/stages');
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
    const identity = { fullName: dev.fullName, username: dev.username };
    // Total/Pending/Completed = APIs this person is the API Development
    // assignee for (the "Api's" column) - one task, one count. Per-stage
    // columns below are computed separately over the full task list, since
    // someone can own Deployment/Mobile/Web on an API they didn't author.
    const devTasks = tasks.filter((t) => matchesUser(t.developer, identity));
    const completed = devTasks.filter((t) => t.apiStatus === 'Completed').length;
    const pending = devTasks.length - completed;
    const breached = devTasks.filter(
      (t) =>
        computeBreach(t.apiDate, t.apiStatus).breached ||
        computeBreach(t.deploymentDate, t.deploymentStatus).breached ||
        computeBreach(t.mobileIntegrationDate, t.mobileStatus).breached ||
        computeBreach(t.webIntegrationDate, t.webStatus).breached
    ).length;

    // Per-stage counts scoped to only the tasks where this person actually
    // owns THAT stage - not their whole lifetime task list.
    const apiDev = stageOwnershipStats(tasks, identity, 'api');
    const deployment = stageOwnershipStats(tasks, identity, 'deployment');
    const mobile = stageOwnershipStats(tasks, identity, 'mobile');
    const web = stageOwnershipStats(tasks, identity, 'web');

    return {
      developer: dev.fullName || dev.username,
      total: devTasks.length,
      pending,
      completed,
      breached,
      apiDevPending: apiDev.pending,
      apiDevCompleted: apiDev.completed,
      deploymentPending: deployment.pending,
      deploymentCompleted: deployment.completed,
      mobilePending: mobile.pending,
      mobileCompleted: mobile.completed,
      webPending: web.pending,
      webCompleted: web.completed,
      deploymentProgressPct: pct(deployment.completed, deployment.total),
      mobileProgressPct: pct(mobile.completed, mobile.total),
      webProgressPct: pct(web.completed, web.total),
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

    const headers = [
      'Developer',
      'Total',
      'Pending',
      'Completed',
      'Breached',
      'API Dev Pend.',
      'Deploy Pend.',
      'Mobile Pend.',
      'Web Pend.',
      'Completion %',
    ];
    const colWidths = [110, 45, 55, 60, 55, 65, 60, 60, 55, 70];
    let y = doc.y;
    let x = doc.x;

    doc.fontSize(9).font('Helvetica-Bold');
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
        r.apiDevPending,
        r.deploymentPending,
        r.mobilePending,
        r.webPending,
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
