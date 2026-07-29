import { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTasks, useDeleteTask } from '@/hooks/useTasks';
import { TaskTable } from '@/components/tasks/TaskTable';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { AssignTaskModal } from '@/components/tasks/AssignTaskModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Task } from '@/lib/types';

async function downloadExport(format: 'csv' | 'xlsx' | 'pdf') {
  const res = await api.get(`/export/${format}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-tasks.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AllTasksPage() {
  const { user } = useAuth();
  const { data, isLoading } = useTasks();
  const deleteTask = useDeleteTask();

  const [editing, setEditing] = useState<Task | null>(null);
  const [assigning, setAssigning] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);

  if (isLoading || !data || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  function handleDelete(task: Task) {
    if (window.confirm(`Delete "${task.apiName}"? This cannot be undone.`)) {
      deleteTask.mutate(task.rowNumber);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => downloadExport('csv')}>
          <Download size={14} /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadExport('xlsx')}>
          <Download size={14} /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadExport('pdf')}>
          <Download size={14} /> PDF
        </Button>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={14} /> New API
        </Button>
      </div>

      <TaskTable
        tasks={data.tasks}
        role={user.role}
        onEdit={setEditing}
        onDelete={handleDelete}
        onAssign={setAssigning}
      />

      <EditTaskModal
        task={editing}
        role={user.role}
        statusOptions={data.statusOptions}
        open={!!editing}
        onClose={() => setEditing(null)}
      />
      <AssignTaskModal task={assigning} open={!!assigning} onClose={() => setAssigning(null)} />
      <CreateTaskModal open={creating} onClose={() => setCreating(false)} statusOptions={data.statusOptions} />
    </div>
  );
}
