import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskTable } from '@/components/tasks/TaskTable';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { matchesUser } from '@/lib/utils';
import { STAGE_OWNER_KEY } from '@/lib/taskFields';
import type { StageKey, Task } from '@/lib/types';

const ALL_STAGES: StageKey[] = ['api', 'deployment', 'mobile', 'web'];

// Lifetime involvement (author OR ever assigned to any stage) - broader than
// isCurrentOwner, so completed/historical work stays visible and filterable.
function isEverInvolved(task: Task, user: { fullName: string; username: string }) {
  return ALL_STAGES.some((stage) => matchesUser(task[STAGE_OWNER_KEY[stage]] as string, user));
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const { data, isLoading } = useTasks();
  const [editing, setEditing] = useState<Task | null>(null);

  const myTasks = useMemo(() => {
    if (!data || !user) return [];
    // Developer scoping already happens server-side. Admin's own "My Tasks"
    // view needs the same filter applied client-side against the full list
    // the server gives an Admin.
    if (user.role === 'Admin') return data.tasks.filter((t) => isEverInvolved(t, user));
    return data.tasks;
  }, [data, user]);

  if (isLoading || !data || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TaskTable tasks={myTasks} role={user.role} onEdit={setEditing} viewerUser={user} />
      <EditTaskModal
        task={editing}
        role={user.role}
        statusOptions={data.statusOptions}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
