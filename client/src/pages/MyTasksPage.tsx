import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskTable } from '@/components/tasks/TaskTable';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { matchesUser } from '@/lib/utils';
import type { Task } from '@/lib/types';

function isCurrentOwner(task: Task, user: { fullName: string; username: string }) {
  return task.activeStages.some((s) => matchesUser(s.owner, user));
}

export default function MyTasksPage() {
  const { user } = useAuth();
  const { data, isLoading } = useTasks();
  const [editing, setEditing] = useState<Task | null>(null);

  const myTasks = useMemo(() => {
    if (!data || !user) return [];
    // Developer scoping already happens server-side (current-stage owner
    // only). Admin's own "My Tasks" view needs the same filter applied
    // client-side against the full list the server gives an Admin.
    if (user.role === 'Admin') return data.tasks.filter((t) => isCurrentOwner(t, user));
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
