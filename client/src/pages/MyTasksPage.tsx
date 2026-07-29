import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { TaskTable } from '@/components/tasks/TaskTable';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { isOwnTask } from '@/lib/utils';
import type { Task } from '@/lib/types';

export default function MyTasksPage() {
  const { user } = useAuth();
  const { data, isLoading } = useTasks();
  const [editing, setEditing] = useState<Task | null>(null);

  const myTasks = useMemo(() => {
    if (!data || !user) return [];
    if (user.role === 'Admin') return data.tasks.filter((t) => isOwnTask(t, user));
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
      <TaskTable tasks={myTasks} role={user.role} onEdit={setEditing} />
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
