const express = require('express');
const { z } = require('zod');
const {
  readTasks,
  writeTaskRow,
  appendTaskRow,
  deleteTaskRow,
  appendActivity,
} = require('../utils/sheetRepo');
const { TASK_COLUMNS, STATUS_OPTIONS } = require('../config/schema');
const { computeBreach, isDueToday } = require('../utils/breach');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const EDITABLE_KEYS_BY_ROLE = {
  Admin: TASK_COLUMNS.map((c) => c.key),
  Developer: TASK_COLUMNS.filter((c) => c.editableBy.includes('Developer')).map((c) => c.key),
};

function attachComputed(task) {
  const apiBreach = computeBreach(task.apiDate, task.apiStatus);
  const deployBreach = computeBreach(task.deploymentDate, task.deploymentStatus);
  const mobileBreach = computeBreach(task.mobileIntegrationDate, task.mobileStatus);
  const webBreach = computeBreach(task.webIntegrationDate, task.webStatus);

  return {
    ...task,
    breach: {
      api: apiBreach,
      deployment: deployBreach,
      mobile: mobileBreach,
      web: webBreach,
      any: apiBreach.breached || deployBreach.breached || mobileBreach.breached || webBreach.breached,
    },
    dueToday:
      isDueToday(task.apiDate) ||
      isDueToday(task.deploymentDate) ||
      isDueToday(task.mobileIntegrationDate) ||
      isDueToday(task.webIntegrationDate),
  };
}

function isOwnTask(task, user) {
  const dev = (task.developer || '').trim().toLowerCase();
  return (
    dev === (user.fullName || '').trim().toLowerCase() ||
    dev === (user.username || '').trim().toLowerCase()
  );
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const scoped = req.user.role === 'Admin' ? tasks : tasks.filter((t) => isOwnTask(t, req.user));
    res.json({ tasks: scoped.map(attachComputed), statusOptions: STATUS_OPTIONS });
  } catch (err) {
    next(err);
  }
});

router.get('/:rowNumber', requireAuth, async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    const tasks = await readTasks();
    const task = tasks.find((t) => t.rowNumber === rowNumber);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (req.user.role !== 'Admin' && !isOwnTask(task, req.user)) {
      return res.status(403).json({ message: 'Not your task' });
    }
    res.json({ task: attachComputed(task) });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const nextSerial = tasks.length
      ? Math.max(...tasks.map((t) => Number(t.serial) || 0)) + 1
      : 1;
    const task = { serial: nextSerial };
    TASK_COLUMNS.forEach((c) => {
      if (c.key === 'serial') return;
      task[c.key] = req.body[c.key] ?? '';
    });
    task.lastUpdatedBy = req.user.fullName || req.user.username;
    task.lastUpdatedAt = new Date().toISOString();

    await appendTaskRow(task);
    await appendActivity({
      timestamp: new Date().toISOString(),
      user: req.user.fullName || req.user.username,
      apiName: task.apiName,
      field: 'created',
      oldValue: '',
      newValue: 'Task created',
      remarks: task.remarks || '',
    });

    res.status(201).json({ message: 'Task created' });
  } catch (err) {
    next(err);
  }
});

router.put('/:rowNumber', requireAuth, async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    const tasks = await readTasks();
    const existing = tasks.find((t) => t.rowNumber === rowNumber);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'Admin' && !isOwnTask(existing, req.user)) {
      return res.status(403).json({ message: 'Not your task' });
    }

    const allowedKeys = EDITABLE_KEYS_BY_ROLE[req.user.role] || [];
    const updated = { ...existing };
    const changes = [];

    Object.keys(req.body || {}).forEach((key) => {
      if (!allowedKeys.includes(key)) return;
      const oldValue = existing[key] ?? '';
      const newValue = req.body[key] ?? '';
      if (String(oldValue) !== String(newValue)) {
        changes.push({ field: key, oldValue, newValue });
        updated[key] = newValue;
      }
    });

    if (changes.length === 0) {
      return res.json({ task: attachComputed(existing), message: 'No changes' });
    }

    updated.lastUpdatedBy = req.user.fullName || req.user.username;
    updated.lastUpdatedAt = new Date().toISOString();

    await writeTaskRow(rowNumber, updated);

    for (const change of changes) {
      await appendActivity({
        timestamp: new Date().toISOString(),
        user: req.user.fullName || req.user.username,
        apiName: updated.apiName,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        remarks: req.body.remarks || '',
      });
    }

    res.json({ task: attachComputed(updated), message: 'Task updated' });
  } catch (err) {
    next(err);
  }
});

router.post('/:rowNumber/assign', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    const { developer } = req.body;
    const tasks = await readTasks();
    const existing = tasks.find((t) => t.rowNumber === rowNumber);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const updated = {
      ...existing,
      developer,
      lastUpdatedBy: req.user.fullName || req.user.username,
      lastUpdatedAt: new Date().toISOString(),
    };
    await writeTaskRow(rowNumber, updated);
    await appendActivity({
      timestamp: new Date().toISOString(),
      user: req.user.fullName || req.user.username,
      apiName: existing.apiName,
      field: 'developer',
      oldValue: existing.developer,
      newValue: developer,
      remarks: 'Reassigned',
    });

    res.json({ task: attachComputed(updated) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:rowNumber', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    const tasks = await readTasks();
    const existing = tasks.find((t) => t.rowNumber === rowNumber);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    await deleteTaskRow(rowNumber);
    await appendActivity({
      timestamp: new Date().toISOString(),
      user: req.user.fullName || req.user.username,
      apiName: existing.apiName,
      field: 'deleted',
      oldValue: '',
      newValue: 'Task deleted',
      remarks: '',
    });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
