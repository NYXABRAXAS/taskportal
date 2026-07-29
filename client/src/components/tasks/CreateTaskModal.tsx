import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { apiErrorMessage } from '@/lib/api';
import { useCreateTask } from '@/hooks/useTasks';

const EMPTY = {
  apiName: '',
  category: '',
  phase: 'Phase 1',
  developer: '',
  apiStatus: 'Pending',
  apiDate: '',
};

export function CreateTaskModal({
  open,
  onClose,
  statusOptions,
}: {
  open: boolean;
  onClose: () => void;
  statusOptions: string[];
}) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const createTask = useCreateTask();

  async function handleSave() {
    setError('');
    if (!form.apiName.trim()) {
      setError('API Name is required');
      return;
    }
    try {
      await createTask.mutateAsync(form);
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create task'));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New API Task">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">API Name *</label>
          <Input value={form.apiName} onChange={(e) => setForm((s) => ({ ...s, apiName: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
            <Input value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Phase</label>
            <Input value={form.phase} onChange={(e) => setForm((s) => ({ ...s, phase: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Assign to</label>
            <Input value={form.developer} onChange={(e) => setForm((s) => ({ ...s, developer: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">API Status</label>
            <Select value={form.apiStatus} onChange={(e) => setForm((s) => ({ ...s, apiStatus: e.target.value }))}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">API Date</label>
          <Input type="date" value={form.apiDate} onChange={(e) => setForm((s) => ({ ...s, apiDate: e.target.value }))} />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={createTask.isPending}>
          {createTask.isPending ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </Modal>
  );
}
