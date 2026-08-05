import type { StageKey, Task } from './types';

export type FieldType = 'text' | 'select' | 'date' | 'textarea';

export interface TaskFieldMeta {
  key: string;
  label: string;
  type: FieldType;
  editableBy: ('Admin' | 'Developer')[];
  // Which pipeline stage this field belongs to. A Developer may only edit a
  // Developer-editable field when it's the task's *current* stage - fields
  // with no stage (remarks) are always eligible once they own the task.
  stage?: StageKey;
}

export const TASK_FIELDS: TaskFieldMeta[] = [
  { key: 'apiName', label: 'API Name', type: 'text', editableBy: ['Admin'] },
  { key: 'category', label: 'Category', type: 'text', editableBy: ['Admin'] },
  { key: 'phase', label: 'Phase', type: 'text', editableBy: ['Admin'] },
  { key: 'developer', label: 'API Development Assignee', type: 'text', editableBy: ['Admin'] },
  { key: 'apiStatus', label: 'API Status', type: 'select', editableBy: ['Admin', 'Developer'], stage: 'api' },
  { key: 'apiDate', label: 'API Date', type: 'date', editableBy: ['Admin'] },
  { key: 'deployment', label: 'Deployment Assignee', type: 'text', editableBy: ['Admin'] },
  { key: 'deploymentStatus', label: 'Deployment Status', type: 'select', editableBy: ['Admin', 'Developer'], stage: 'deployment' },
  { key: 'deploymentDate', label: 'Deployment Date', type: 'date', editableBy: ['Admin', 'Developer'], stage: 'deployment' },
  { key: 'mobileIntegration', label: 'Mobile Integration Assignee', type: 'text', editableBy: ['Admin'] },
  { key: 'mobileStatus', label: 'Mobile Status', type: 'select', editableBy: ['Admin', 'Developer'], stage: 'mobile' },
  { key: 'mobileIntegrationDate', label: 'Mobile Integration Date', type: 'date', editableBy: ['Admin', 'Developer'], stage: 'mobile' },
  { key: 'webIntegration', label: 'Web Integration Assignee', type: 'text', editableBy: ['Admin'] },
  { key: 'webStatus', label: 'Web Status', type: 'select', editableBy: ['Admin', 'Developer'], stage: 'web' },
  { key: 'webIntegrationDate', label: 'Web Integration Date', type: 'date', editableBy: ['Admin', 'Developer'], stage: 'web' },
  { key: 'remarks', label: 'Remarks', type: 'textarea', editableBy: ['Admin', 'Developer'] },
];

export const STAGE_LABELS: Record<StageKey, string> = {
  api: 'API Development',
  deployment: 'Deployment',
  mobile: 'Mobile Integration',
  web: 'Web Integration',
};

// Which raw Task field holds the assignee name for each stage.
export const STAGE_OWNER_KEY: Record<StageKey, keyof Task> = {
  api: 'developer',
  deployment: 'deployment',
  mobile: 'mobileIntegration',
  web: 'webIntegration',
};
