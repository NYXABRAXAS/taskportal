import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Paperclip, Upload } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { TASK_FIELDS } from '@/lib/taskFields';
import { toDateInputValue } from '@/lib/utils';
import { api, apiErrorMessage, resolveAssetUrl } from '@/lib/api';
import { useUpdateTask } from '@/hooks/useTasks';
import type { Role, Task } from '@/lib/types';

export function EditTaskModal({
  task,
  role,
  statusOptions,
  open,
  onClose,
}: {
  task: Task | null;
  role: Role;
  statusOptions: string[];
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!task) return;
    const init: Record<string, string> = {};
    TASK_FIELDS.forEach((f) => {
      const raw = (task as any)[f.key] ?? '';
      init[f.key] = f.type === 'date' ? toDateInputValue(raw) : raw;
    });
    setForm(init);
    setError('');
  }, [task]);

  if (!task) return null;

  const editableFields = TASK_FIELDS.filter((f) => f.editableBy.includes(role));

  async function handleSave() {
    setError('');
    try {
      const patch: Record<string, string> = {};
      editableFields.forEach((f) => (patch[f.key] = form[f.key] ?? ''));
      await updateTask.mutateAsync({ rowNumber: task!.rowNumber, patch });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save changes'));
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/tasks/${task!.rowNumber}/attachment`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (err) {
      setError(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={task.apiName || 'Edit Task'} widthClass="max-w-2xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {editableFields.map((f) => (
          <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
              {f.label}
            </label>
            {f.type === 'select' ? (
              <Select value={form[f.key] || ''} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}>
                <option value="">Select status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            ) : f.type === 'date' ? (
              <Input
                type="date"
                value={form[f.key] || ''}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            ) : f.type === 'textarea' ? (
              <Textarea
                rows={3}
                value={form[f.key] || ''}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            ) : (
              <Input
                value={form[f.key] || ''}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Attachment (screenshot / document, max 20MB)
          </label>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload file'}
            </Button>
            {task.attachmentUrl && (
              <a
                href={resolveAssetUrl(task.attachmentUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                <Paperclip size={12} /> View current attachment
              </a>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
          </div>
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
        <Button onClick={handleSave} disabled={updateTask.isPending}>
          {updateTask.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}
