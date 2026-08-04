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
const { STAGES, getActiveStages, getActiveOwnedStages, isCurrentOwner } = require('../utils/stages');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const ADMIN_EDITABLE_KEYS = TASK_COLUMNS.map((c) => c.key);

function attachComputed(task) {
  const apiBreach = computeBreach(task.apiDate, task.apiStatus);
  const deployBreach = computeBreach(task.deploymentDate, task.deploymentStatus);
  const mobileBreach = computeBreach(task.mobileIntegrationDate, task.mobileStatus);
  const webBreach = computeBreach(task.webIntegrationDate, task.webStatus);

  const active = getActiveStages(task);

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
    activeStages: active.map((s) => ({ key: s.key, label: s.label, owner: task[s.ownerKey] || '' })),
    allStagesDone: active.length === 0,
    stageProgress: STAGES.map((s) => ({
      key: s.key,
      label: s.label,
      owner: task[s.ownerKey] || '',
      status: task[s.statusKey] || 'Pending',
    })),
  };
}

// What a Developer may edit on this specific task: the status + date of
// every stage that's both (a) currently active and (b) owned by them - a
// person can own two active stages at once (e.g. Deployment AND Mobile),
// plus remarks/attachment. (They only reach here if isCurrentOwner passed.)
function developerEditableKeys(task, user) {
  const owned = getActiveOwnedStages(task, user);
  const keys = ['remarks', 'attachmentUrl'];
  owned.forEach((stage) => keys.push(stage.statusKey, stage.dateKey));
  return keys;
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const scoped = req.user.role === 'Admin' ? tasks : tasks.filter((t) => isCurrentOwner(t, req.user));
    res.json({ tasks: scoped.map(attachComputed), statusOptions: STATUS_OPTIONS, stages: STAGES.map((s) => ({ key: s.key, label: s.label })) });
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
    if (req.user.role !== 'Admin' && !isCurrentOwner(task, req.user)) {
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

    const isAdmin = req.user.role === 'Admin';
    if (!isAdmin && !isCurrentOwner(existing, req.user)) {
      return res.status(403).json({ message: 'Not your task' });
    }

    const allowedKeys = isAdmin ? ADMIN_EDITABLE_KEYS : developerEditableKeys(existing, req.user);
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

const assignSchema = z.object({
  stage: z.enum(['api', 'deployment', 'mobile', 'web']).default('api'),
  name: z.string(),
});

router.post('/:rowNumber/assign', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const rowNumber = Number(req.params.rowNumber);
    const parsed = assignSchema.safeParse({
      stage: req.body.stage,
      name: req.body.name ?? req.body.developer, // back-compat with older client payload shape
    });
    if (!parsed.success) return res.status(400).json({ message: 'Invalid assignment payload' });

    const { stage: stageKey, name } = parsed.data;
    const stage = STAGES.find((s) => s.key === stageKey);

    const tasks = await readTasks();
    const existing = tasks.find((t) => t.rowNumber === rowNumber);
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const updated = {
      ...existing,
      [stage.ownerKey]: name,
      lastUpdatedBy: req.user.fullName || req.user.username,
      lastUpdatedAt: new Date().toISOString(),
    };
    await writeTaskRow(rowNumber, updated);
    await appendActivity({
      timestamp: new Date().toISOString(),
      user: req.user.fullName || req.user.username,
      apiName: existing.apiName,
      field: `${stage.label} assignee`,
      oldValue: existing[stage.ownerKey],
      newValue: name,
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
