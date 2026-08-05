// Central notification dispatcher: diffs a task before/after a save and
// fires the right email + in-app notification (via the existing ActivityLog
// feed, so the notification bell/center needs no UI changes) + email audit
// log entry for each rule:
//   - stage owner set (was empty)      -> "assigned" email to new owner
//   - stage owner changed (non-empty)  -> "reassigned" email to old + new owner
//   - stage due date changed           -> email to current owner (if any)
//   - stage status becomes Completed   -> email to all Admins
//
// Every notify* call is fire-and-forget from the caller's perspective -
// sendMail() never throws, so a slow/broken mail server can never fail or
// delay the task save itself.

const { readUsers, appendActivity } = require('./sheetRepo');
const { sendMail } = require('./email');
const { STAGES } = require('./stages');

function formatDateForEmail(value) {
  if (!value) return '-';
  const s = String(value).trim();
  let d;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    d = new Date(s);
  } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, day, y] = s.split('/').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(s);
  }
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function findUserEmail(users, name) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return '';
  const match = users.find(
    (u) => (u.fullName || '').trim().toLowerCase() === n || (u.username || '').trim().toLowerCase() === n
  );
  return match ? match.email : '';
}

const PORTAL_URL = () => process.env.PORTAL_URL || '';

async function logNotification({ recipient, task, field, oldValue, newValue, remarks }) {
  await appendActivity({
    timestamp: new Date().toISOString(),
    user: recipient,
    apiName: task.apiName,
    field,
    oldValue: oldValue || '',
    newValue: newValue || '',
    remarks,
  }).catch((err) => console.error('Failed to log in-app notification:', err.message));
}

async function notifyAssigned({ task, stageLabel, assigneeName, dueDate }, users) {
  const email = findUserEmail(users, assigneeName);
  const subject = `New API Task Assigned - ${task.apiName}`;
  const text = [
    `Hello ${assigneeName},`,
    '',
    'A new API task has been assigned to you.',
    '',
    `API Name: ${task.apiName}`,
    `Category: ${task.category}`,
    `Phase: ${task.phase}`,
    `Stage: ${stageLabel}`,
    `Assigned Date: ${formatDateForEmail(task.assignedDate)}`,
    `Due Date: ${formatDateForEmail(dueDate)}`,
    '',
    'Please log in to the API Task Portal and start working on the assigned task.',
    `Portal: ${PORTAL_URL()}`,
    '',
    'Regards',
    'API Task Portal',
  ].join('\n');

  await sendMail({ to: email, subject, text, recipientName: assigneeName, action: 'Task Assigned' });
  await logNotification({
    recipient: assigneeName,
    task,
    field: 'Task Assigned',
    newValue: stageLabel,
    remarks: `New API Assigned: ${task.apiName} has been assigned to you.`,
  });
}

async function notifyReassigned({ task, stageLabel, previousAssigneeName, newAssigneeName, dueDate }, users) {
  const subject = 'API Task Reassigned';
  const bodyFor = (name) =>
    [
      `Hello ${name},`,
      '',
      `The ${stageLabel} stage of "${task.apiName}" has been reassigned.`,
      '',
      `API Name: ${task.apiName}`,
      `Category: ${task.category}`,
      `Phase: ${task.phase}`,
      `Previous Assignee: ${previousAssigneeName || '-'}`,
      `New Assignee: ${newAssigneeName}`,
      `Due Date: ${formatDateForEmail(dueDate)}`,
      '',
      `Portal: ${PORTAL_URL()}`,
      '',
      'Regards',
      'API Task Portal',
    ].join('\n');

  const recipients = [...new Set([previousAssigneeName, newAssigneeName].filter(Boolean))];
  for (const name of recipients) {
    const email = findUserEmail(users, name);
    await sendMail({ to: email, subject, text: bodyFor(name), recipientName: name, action: 'Task Reassigned' });
    await logNotification({
      recipient: name,
      task,
      field: 'Task Reassigned',
      oldValue: previousAssigneeName,
      newValue: newAssigneeName,
      remarks: `${stageLabel} reassigned from ${previousAssigneeName || 'Unassigned'} to ${newAssigneeName}`,
    });
  }
}

async function notifyDueDateChanged({ task, stageLabel, assigneeName, oldDate, newDate }, users) {
  const email = findUserEmail(users, assigneeName);
  const subject = `Due Date Changed - ${task.apiName}`;
  const text = [
    `Hello ${assigneeName},`,
    '',
    `The due date for the ${stageLabel} stage of "${task.apiName}" has changed.`,
    '',
    `API Name: ${task.apiName}`,
    `Old Due Date: ${formatDateForEmail(oldDate)}`,
    `New Due Date: ${formatDateForEmail(newDate)}`,
    '',
    `Portal: ${PORTAL_URL()}`,
    '',
    'Regards',
    'API Task Portal',
  ].join('\n');

  await sendMail({ to: email, subject, text, recipientName: assigneeName, action: 'Due Date Changed' });
  await logNotification({
    recipient: assigneeName,
    task,
    field: 'Due Date Changed',
    oldValue: formatDateForEmail(oldDate),
    newValue: formatDateForEmail(newDate),
    remarks: `${stageLabel} due date changed`,
  });
}

async function notifyCompleted({ task, stageLabel, completedBy }, users) {
  const admins = users.filter((u) => u.role === 'Admin');
  const subject = `API Task Completed - ${task.apiName}`;
  const text = [
    'Hello,',
    '',
    `The ${stageLabel} stage of "${task.apiName}" has been marked Completed by ${completedBy}.`,
    '',
    `API Name: ${task.apiName}`,
    `Category: ${task.category}`,
    `Phase: ${task.phase}`,
    '',
    `Portal: ${PORTAL_URL()}`,
    '',
    'Regards',
    'API Task Portal',
  ].join('\n');

  for (const admin of admins) {
    await sendMail({
      to: admin.email,
      subject,
      text,
      recipientName: admin.fullName || admin.username,
      action: 'Task Completed',
    });
  }
  await logNotification({
    recipient: completedBy,
    task,
    field: 'Task Completed',
    newValue: stageLabel,
    remarks: `${stageLabel} marked Completed by ${completedBy}`,
  });
}

// Diffs `existing` against `updated` for every stage and fires whichever
// rules apply. Safe to call after any create/update/assign write - errors
// in any single notification are caught and logged, never thrown.
async function dispatchTaskChangeNotifications(existing, updated, actorUser) {
  try {
    const users = await readUsers();
    const actorName = actorUser.fullName || actorUser.username;

    for (const stage of STAGES) {
      const oldOwner = (existing[stage.ownerKey] || '').trim();
      const newOwner = (updated[stage.ownerKey] || '').trim();
      const oldStatus = existing[stage.statusKey];
      const newStatus = updated[stage.statusKey];
      const oldDate = existing[stage.dateKey];
      const newDate = updated[stage.dateKey];

      if (oldOwner !== newOwner) {
        if (!oldOwner && newOwner) {
          await notifyAssigned({ task: updated, stageLabel: stage.label, assigneeName: newOwner, dueDate: newDate }, users);
        } else if (oldOwner && newOwner) {
          await notifyReassigned(
            { task: updated, stageLabel: stage.label, previousAssigneeName: oldOwner, newAssigneeName: newOwner, dueDate: newDate },
            users
          );
        }
      } else if (newOwner && oldDate !== newDate) {
        await notifyDueDateChanged({ task: updated, stageLabel: stage.label, assigneeName: newOwner, oldDate, newDate }, users);
      }

      if (oldStatus !== 'Completed' && newStatus === 'Completed') {
        await notifyCompleted({ task: updated, stageLabel: stage.label, completedBy: actorName }, users);
      }
    }
  } catch (err) {
    console.error('Notification dispatch failed:', err.message);
  }
}

module.exports = { dispatchTaskChangeNotifications, formatDateForEmail };
