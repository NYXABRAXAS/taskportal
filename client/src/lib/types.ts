export type Role = 'Admin' | 'Developer';

export interface AuthUser {
  username: string;
  role: Role;
  fullName: string;
  email: string;
}

export interface BreachInfo {
  breached: boolean;
  days: number;
}

export type StageKey = 'api' | 'deployment' | 'mobile' | 'web';

export interface ActiveStage {
  key: StageKey;
  label: string;
  owner: string;
}

export interface StageProgressItem {
  key: StageKey;
  label: string;
  owner: string;
  status: string;
}

export interface Task {
  rowNumber: number;
  serial: string | number;
  apiName: string;
  category: string;
  phase: string;
  developer: string;
  apiStatus: string;
  apiDate: string;
  deployment: string;
  deploymentStatus: string;
  deploymentDate: string;
  mobileIntegration: string;
  mobileStatus: string;
  mobileIntegrationDate: string;
  webIntegration: string;
  webStatus: string;
  webIntegrationDate: string;
  remarks: string;
  attachmentUrl: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  breach: {
    api: BreachInfo;
    deployment: BreachInfo;
    mobile: BreachInfo;
    web: BreachInfo;
    any: boolean;
  };
  dueToday: boolean;
  // Stages currently actionable on this task right now. Once API
  // Development is Completed, Deployment/Mobile/Web all open in parallel -
  // so this can hold more than one stage (each with its own owner) at once.
  activeStages: ActiveStage[];
  allStagesDone: boolean;
  stageProgress: StageProgressItem[];
}

export interface DashboardStats {
  totalApis: number;
  pendingApis: number;
  completedApis: number;
  deploymentPending: number;
  deploymentCompleted: number;
  mobilePending: number;
  mobileCompleted: number;
  webPending: number;
  webCompleted: number;
  breachedApis: number;
  todaysDue: number;
  completionPct: number;
  statusPie: Record<string, number>;
  phaseWise: Record<string, number>;
  categoryWise: Record<string, number>;
  monthlyProgress: { month: string; total: number; completed: number }[];
  totalDevelopers?: number;
  byDeveloper?: {
    developer: string;
    total: number;
    completed: number;
    pending: number;
    completionPct: number;
  }[];
  recentUpdates?: { apiName: string; status: string; lastUpdatedAt: string }[];
  currentOwnerBreakdown?: { owner: string; count: number }[];
}

export interface AppUser {
  rowNumber: number;
  username: string;
  role: Role;
  fullName: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface ActivityItem {
  timestamp: string;
  user: string;
  apiName: string;
  field: string;
  oldValue: string;
  newValue: string;
  remarks: string;
}

export interface DeveloperReportRow {
  developer: string;
  total: number;
  pending: number;
  completed: number;
  breached: number;
  apiDevPending: number;
  apiDevCompleted: number;
  deploymentPending: number;
  deploymentCompleted: number;
  mobilePending: number;
  mobileCompleted: number;
  webPending: number;
  webCompleted: number;
  deploymentProgressPct: number;
  mobileProgressPct: number;
  webProgressPct: number;
  completionPct: number;
}
