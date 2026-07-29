export type FieldType = 'text' | 'select' | 'date' | 'textarea';

export interface TaskFieldMeta {
  key: string;
  label: string;
  type: FieldType;
  editableBy: ('Admin' | 'Developer')[];
}

export const TASK_FIELDS: TaskFieldMeta[] = [
  { key: 'apiName', label: 'API Name', type: 'text', editableBy: ['Admin'] },
  { key: 'category', label: 'Category', type: 'text', editableBy: ['Admin'] },
  { key: 'phase', label: 'Phase', type: 'text', editableBy: ['Admin'] },
  { key: 'developer', label: "Api's (Developer)", type: 'text', editableBy: ['Admin'] },
  { key: 'apiStatus', label: 'API Status', type: 'select', editableBy: ['Admin', 'Developer'] },
  { key: 'apiDate', label: 'API Date', type: 'date', editableBy: ['Admin'] },
  { key: 'deployment', label: 'Deployment', type: 'text', editableBy: ['Admin', 'Developer'] },
  { key: 'deploymentStatus', label: 'Deployment Status', type: 'select', editableBy: ['Admin', 'Developer'] },
  { key: 'deploymentDate', label: 'Deployment Date', type: 'date', editableBy: ['Admin', 'Developer'] },
  { key: 'mobileIntegration', label: 'Mobile Integration', type: 'text', editableBy: ['Admin', 'Developer'] },
  { key: 'mobileStatus', label: 'Mobile Status', type: 'select', editableBy: ['Admin', 'Developer'] },
  { key: 'mobileIntegrationDate', label: 'Mobile Integration Date', type: 'date', editableBy: ['Admin', 'Developer'] },
  { key: 'webIntegration', label: 'Web Integration', type: 'text', editableBy: ['Admin', 'Developer'] },
  { key: 'webStatus', label: 'Web Status', type: 'select', editableBy: ['Admin', 'Developer'] },
  { key: 'webIntegrationDate', label: 'Web Integration Date', type: 'date', editableBy: ['Admin', 'Developer'] },
  { key: 'remarks', label: 'Remarks', type: 'textarea', editableBy: ['Admin', 'Developer'] },
];
