import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { apiErrorMessage } from '@/lib/api';
import { useAssignTask } from '@/hooks/useTasks';
import { STAGE_LABELS } from '@/lib/taskFields';
import type { StageKey, Task } from '@/lib/types';

const STAGE_OWNER_KEY: Record<StageKey, keyof Task> = {
  api: 'developer',
  deployment: 'deployment',
  mobile: 'mobileIntegration',
  web: 'webIntegration',
};

export function AssignTaskModal({ task, open, onClose }: { task: Task | null; open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<StageKey>('api');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const assignTask = useAssignTask();

  useEffect(() => {
    if (!task) return;
    const initialStage = task.activeStages[0]?.key ?? 'api';
    setStage(initialStage);
    setName((task[STAGE_OWNER_KEY[initialStage]] as string) || '');
    setError('');
  }, [task]);

  if (!task) return null;

  function handleStageChange(next: StageKey) {
    setStage(next);
    setName((task![STAGE_OWNER_KEY[next]] as string) || '');
  }

  async function handleSave() {
    setError('');
    try {
      await assignTask.mutateAsync({ rowNumber: task!.rowNumber, stage, name });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reassign task'));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Reassign: ${task.apiName}`}>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Stage</label>
          <Select value={stage} onChange={(e) => handleStageChange(e.target.value as StageKey)}>
            {(Object.keys(STAGE_LABELS) as StageKey[]).map((key) => (
              <option key={key} value={key}>
                {STAGE_LABELS[key]}
              </option>
            ))}
          </Select>
          {task.activeStages.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Currently active: {task.activeStages.map((s) => s.label).join(', ')}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Assignee (full name)</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mayank" />
        </div>
      </div>
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
