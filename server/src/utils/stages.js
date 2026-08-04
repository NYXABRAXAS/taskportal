// Stage-gating workflow: an API moves through 4 stages, each with its own
// owner (assignee), status, and target date.
//
// Gating rule: Stage 1 (API Development) blocks everything else. While it
// isn't Completed, only that stage is "active". The moment it's Completed,
// Deployment, Mobile Integration, and Web Integration all become active
// *in parallel* - they do NOT block each other. So if Deployment is owned
// by Shiv and Web by Mayank, both see the task in their pending list at the
// same time, independently, as soon as API Development finishes.

const STAGES = [
  {
    key: 'api',
    label: 'API Development',
    ownerKey: 'developer',
    statusKey: 'apiStatus',
    dateKey: 'apiDate',
  },
  {
    key: 'deployment',
    label: 'Deployment',
    ownerKey: 'deployment',
    statusKey: 'deploymentStatus',
    dateKey: 'deploymentDate',
  },
  {
    key: 'mobile',
    label: 'Mobile Integration',
    ownerKey: 'mobileIntegration',
    statusKey: 'mobileStatus',
    dateKey: 'mobileIntegrationDate',
  },
  {
    key: 'web',
    label: 'Web Integration',
    ownerKey: 'webIntegration',
    statusKey: 'webStatus',
    dateKey: 'webIntegrationDate',
  },
];

// Stages that are currently actionable on this task right now.
function getActiveStages(task) {
  if (task.apiStatus !== 'Completed') return [STAGES[0]];
  return STAGES.slice(1).filter((stage) => task[stage.statusKey] !== 'Completed');
}

function matchesUser(name, user) {
  const n = (name || '').trim().toLowerCase();
  if (!n) return false;
  return (
    n === (user.fullName || '').trim().toLowerCase() || n === (user.username || '').trim().toLowerCase()
  );
}

// Every stage (active or not) this task ever assigns to this user -
// "lifetime involvement", used for total/completed counts that shouldn't
// vanish once a person's part is done.
function getAllOwnedStages(task, user) {
  return STAGES.filter((stage) => matchesUser(task[stage.ownerKey], user));
}

// Active stages specifically owned by this user right now - this is what
// makes a task actionable / "currently assigned to them".
function getActiveOwnedStages(task, user) {
  return getActiveStages(task).filter((stage) => matchesUser(task[stage.ownerKey], user));
}

function isCurrentOwner(task, user) {
  return getActiveOwnedStages(task, user).length > 0;
}

function isEverInvolved(task, user) {
  return getAllOwnedStages(task, user).length > 0;
}

// Every stage owned by this user is Completed (nothing left for them to do
// on this task, ever).
function isFullyDoneForUser(task, user) {
  const owned = getAllOwnedStages(task, user);
  return owned.length > 0 && owned.every((stage) => task[stage.statusKey] === 'Completed');
}

function stageSummary(task) {
  const active = getActiveStages(task);
  return {
    activeStages: active.map((s) => ({ key: s.key, label: s.label, owner: task[s.ownerKey] || '' })),
    done: active.length === 0,
    progress: STAGES.map((s) => ({
      key: s.key,
      label: s.label,
      owner: task[s.ownerKey] || '',
      status: task[s.statusKey] || 'Pending',
    })),
  };
}

module.exports = {
  STAGES,
  getActiveStages,
  matchesUser,
  getAllOwnedStages,
  getActiveOwnedStages,
  isCurrentOwner,
  isEverInvolved,
  isFullyDoneForUser,
  stageSummary,
};
