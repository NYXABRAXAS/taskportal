import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiErrorMessage } from '@/lib/api';
import { useAssignTask } from '@/hooks/useTasks';
import type { Task } from '@/lib/types';

export function AssignTaskModal({ task, open, onClose }: { task: Task | null; open: boolean; onClose: () => void }) {
  const [developer, setDeveloper] = useState('');
  const [error, setError] = useState('');
  const assignTask = useAssignTask();

  useEffect(() => {
    setDeveloper(task?.developer || '');
    setError('');
  }, [task]);

  if (!task) return null;

  async function handleSave() {
    setError('');
    try {
      await assignTask.mutateAsync({ rowNumber: task!.rowNumber, developer });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reassign task'));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Reassign: ${task.apiName}`}>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Assign to (developer full name)</label>
      <Input value={developer} onChange={(e) => setDeveloper(e.target.value)} placeholder="e.g. Mayank" />
      {error && (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={assignTask.isPending}>
          {assignTask.isPending ? 'Saving...' : 'Reassign'}
        </Button>
      </div>
    </Modal>
  );
}
