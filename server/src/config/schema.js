// Column layout of the "Api list" tab (A -> P are the user's existing columns,
// Q -> T are appended by this app to support remarks/attachments/audit info
// without disturbing the original sheet structure).
//
// IMPORTANT: three of the original headers are literally all named "Status"
// (API Status / Deployment Status / Mobile Status / Web Status). Because of
// that we never trust header text - we always address columns positionally.

const TASK_COLUMNS = [
  { key: 'serial', header: '#', editableBy: [] },
  { key: 'apiName', header: 'API Name', editableBy: ['Admin'] },
  { key: 'category', header: 'Category', editableBy: ['Admin'] },
  { key: 'phase', header: 'Phase', editableBy: ['Admin'] },
  { key: 'developer', header: "Api's", editableBy: ['Admin'] },
  { key: 'apiStatus', header: 'Status', editableBy: ['Admin', 'Developer'] },
  { key: 'apiDate', header: 'Api Date', editableBy: ['Admin'] },
  // deployment/mobileIntegration/webIntegration hold the *assignee name* for
  // that stage (not free text) - only Admin reassigns who owns a stage.
  { key: 'deployment', header: 'Deployment', editableBy: ['Admin'] },
  { key: 'deploymentStatus', header: 'Status', editableBy: ['Admin', 'Developer'] },
  { key: 'deploymentDate', header: 'Deployment Date', editableBy: ['Admin', 'Developer'] },
  { key: 'mobileIntegration', header: 'Mobile Integration', editableBy: ['Admin'] },
  { key: 'mobileStatus', header: 'Status', editableBy: ['Admin', 'Developer'] },
  { key: 'mobileIntegrationDate', header: 'Mobile Integration Date', editableBy: ['Admin', 'Developer'] },
  { key: 'webIntegration', header: 'Web Integration', editableBy: ['Admin'] },
  { key: 'webStatus', header: 'Status', editableBy: ['Admin', 'Developer'] },
  { key: 'webIntegrationDate', header: 'Web Integration Date', editableBy: ['Admin', 'Developer'] },
  { key: 'remarks', header: 'Remarks', editableBy: ['Admin', 'Developer'] },
  { key: 'attachmentUrl', header: 'Attachment', editableBy: ['Admin', 'Developer'] },
  { key: 'lastUpdatedBy', header: 'Last Updated By', editableBy: [] },
  { key: 'lastUpdatedAt', header: 'Last Updated At', editableBy: [] },
];

const RANGE_LAST_COLUMN = 'T'; // A..T = 20 columns
const HEADER_ROW = 1;
const FIRST_DATA_ROW = 2;

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Blocked', 'On Hold'];

const STATUS_COLORS = {
  Pending: '#ef4444',
  'In Progress': '#f97316',
  Completed: '#22c55e',
  Blocked: '#6b7280',
  'On Hold': '#a855f7',
};

const USER_COLUMNS = ['username', 'password', 'role', 'fullName', 'email', 'status'];

const ACTIVITY_COLUMNS = [
  'timestamp',
  'user',
  'apiName',
  'field',
  'oldValue',
  'newValue',
  'remarks',
];

module.exports = {
  TASK_COLUMNS,
  RANGE_LAST_COLUMN,
  HEADER_ROW,
  FIRST_DATA_ROW,
  STATUS_OPTIONS,
  STATUS_COLORS,
  USER_COLUMNS,
  ACTIVITY_COLUMNS,
};
