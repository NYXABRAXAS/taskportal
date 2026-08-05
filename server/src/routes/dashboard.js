const express = require('express');
const { readTasks, readUsers } = require('../utils/sheetRepo');
const { computeBreach, isDueToday } = require('../utils/breach');
const { isEverInvolved, isFullyDoneForUser, getActiveStages, stageOwnershipStats } = require('../utils/stages');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function pct(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 1000) / 10;
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const allTasks = await readTasks();
    const isAdmin = req.user.role === 'Admin';

    // Admin: company-wide totals over every task. Developer: lifetime
    // involvement only (any stage, ever) - total shouldn't drop to 0 just
    // because they finished their part and the ball moved on.
    const tasks = isAdmin ? allTasks : allTasks.filter((t) => isEverInvolved(t, req.user));

    const total = tasks.length;
    let completed;
    let pending;
    let deploymentPending;
    let deploymentCompleted;
    let mobilePending;
    let mobileCompleted;
    let webPending;
    let webCompleted;

    if (isAdmin) {
      completed = tasks.filter((t) => t.apiStatus === 'Completed').length;
      pending = total - completed;
      deploymentPending = tasks.filter((t) => t.deploymentStatus !== 'Completed').length;
      deploymentCompleted = tasks.filter((t) => t.deploymentStatus === 'Completed').length;
      mobilePending = tasks.filter((t) => t.mobileStatus !== 'Completed').length;
      mobileCompleted = tasks.filter((t) => t.mobileStatus === 'Completed').length;
      webPending = tasks.filter((t) => t.webStatus !== 'Completed').length;
      webCompleted = tasks.filter((t) => t.webStatus === 'Completed').length;
    } else {
      // "Completed" for a person means every stage THEY own on that task is
      // Completed - not just the API Development status.
      completed = tasks.filter((t) => isFullyDoneForUser(t, req.user)).length;
      pending = total - completed;

      const deploy = stageOwnershipStats(tasks, req.user, 'deployment');
      const mobile = stageOwnershipStats(tasks, req.user, 'mobile');
      const web = stageOwnershipStats(tasks, req.user, 'web');
      deploymentPending = deploy.pending;
      deploymentCompleted = deploy.completed;
      mobilePending = mobile.pending;
      mobileCompleted = mobile.completed;
      webPending = web.pending;
      webCompleted = web.completed;
    }

    const breached = tasks.filter((t) => {
      return (
        computeBreach(t.apiDate, t.apiStatus).breached ||
        computeBreach(t.deploymentDate, t.deploymentStatus).breached ||
        computeBreach(t.mobileIntegrationDate, t.mobileStatus).breached ||
        computeBreach(t.webIntegrationDate, t.webStatus).breached
      );
    }).length;

    const dueToday = tasks.filter(
      (t) =>
        isDueToday(t.apiDate) ||
        isDueToday(t.deploymentDate) ||
        isDueToday(t.mobileIntegrationDate) ||
        isDueToday(t.webIntegrationDate)
    ).length;

    const statusPie = {};
    tasks.forEach((t) => {
      const s = t.apiStatus || 'Pending';
      statusPie[s] = (statusPie[s] || 0) + 1;
    });

    const phaseWise = {};
    tasks.forEach((t) => {
      const p = t.phase || 'Unassigned';
      phaseWise[p] = (phaseWise[p] || 0) + 1;
    });

    const categoryWise = {};
    tasks.forEach((t) => {
      const c = t.category || 'Unassigned';
      categoryWise[c] = (categoryWise[c] || 0) + 1;
    });

    const monthly = {};
    tasks.forEach((t) => {
      if (!t.apiDate) return;
      const d = new Date(t.apiDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = monthly[key] || { total: 0, completed: 0 };
      monthly[key].total += 1;
      if (t.apiStatus === 'Completed') monthly[key].completed += 1;
    });

    const base = {
      totalApis: total,
      pendingApis: pending,
      completedApis: completed,
      deploymentPending,
      deploymentCompleted,
      mobilePending,
      mobileCompleted,
      webPending,
      webCompleted,
      breachedApis: breached,
      todaysDue: dueToday,
      completionPct: pct(completed, total),
      statusPie,
      phaseWise,
      categoryWise,
      monthlyProgress: Object.entries(monthly)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([month, v]) => ({ month, ...v })),
    };

    if (isAdmin) {
      const users = await readUsers();
      const developers = users.filter((u) => u.role === 'Developer');

      const byDeveloper = developers.map((dev) => {
        const identity = { fullName: dev.fullName, username: dev.username };
        const devTasks = allTasks.filter((t) => isEverInvolved(t, identity));
        const devCompleted = devTasks.filter((t) => isFullyDoneForUser(t, identity)).length;
        return {
          developer: dev.fullName || dev.username,
          total: devTasks.length,
          completed: devCompleted,
          pending: devTasks.length - devCompleted,
          completionPct: pct(devCompleted, devTasks.length),
        };
      });

      base.totalDevelopers = developers.length;
      base.byDeveloper = byDeveloper;

      // Who currently has the ball on each not-yet-done API (aggregate view
      // of "current owner of each pending stage" across the whole pipeline).
      // A task can count toward more than one person at once now that
      // Deployment/Mobile/Web run in parallel once API Dev is done.
      const owners = {};
      allTasks.forEach((t) => {
        const activeOwners = new Set(
          getActiveStages(t)
            .map((s) => (t[s.ownerKey] || '').trim())
            .filter(Boolean)
        );
        activeOwners.forEach((owner) => {
          owners[owner] = (owners[owner] || 0) + 1;
        });
      });
      base.currentOwnerBreakdown = Object.entries(owners)
        .map(([owner, count]) => ({ owner, count }))
        .sort((a, b) => b.count - a.count);
    } else {
      base.recentUpdates = tasks
        .filter((t) => t.lastUpdatedAt)
        .sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt))
        .slice(0, 8)
        .map((t) => ({
          apiName: t.apiName,
          status: t.apiStatus,
          lastUpdatedAt: t.lastUpdatedAt,
        }));
    }

    res.json(base);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
