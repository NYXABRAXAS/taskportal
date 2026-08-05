import { useState } from 'react';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useResetPassword, useDeleteUser } from '@/hooks/useUsers';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/Badge';
import { apiErrorMessage } from '@/lib/api';
import { initials } from '@/lib/utils';
import type { AppUser, Role } from '@/lib/types';

const EMPTY_USER = { username: '', password: '', role: 'Developer', fullName: '', email: '', status: 'Active' };

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetPassword();
  const deleteUser = useDeleteUser();

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_USER);
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editTarget, setEditTarget] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState<{ fullName: string; email: string; role: Role; status: 'Active' | 'Inactive' }>({
    fullName: '',
    email: '',
    role: 'Developer',
    status: 'Active',
  });
  const [editError, setEditError] = useState('');

  async function handleCreate() {
    setError('');
    try {
      await createUser.mutateAsync(form);
      setForm(EMPTY_USER);
      setCreating(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create user'));
    }
  }

  function openEdit(u: AppUser) {
    setEditTarget(u);
    setEditForm({ fullName: u.fullName, email: u.email, role: u.role, status: u.status });
    setEditError('');
  }

  async function handleEditSave() {
    if (!editTarget) return;
    setEditError('');
    try {
      await updateUser.mutateAsync({ rowNumber: editTarget.rowNumber, patch: editForm });
      setEditTarget(null);
    } catch (err) {
      setEditError(apiErrorMessage(err, 'Could not update user'));
    }
  }

  async function handleReset() {
    if (!resetTarget) return;
    try {
      await resetPassword.mutateAsync({ rowNumber: resetTarget.rowNumber, password: newPassword });
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not reset password'));
    }
  }

  function handleDelete(u: AppUser) {
    if (window.confirm(`Delete user "${u.username}"?`)) {
      deleteUser.mutate(u.rowNumber);
    }
  }

  function toggleStatus(u: AppUser) {
    updateUser.mutate({ rowNumber: u.rowNumber, patch: { status: u.status === 'Active' ? 'Inactive' : 'Active' } });
  }

  if (isLoading || !users) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={14} /> New User
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.rowNumber} className="border-t border-slate-100 dark:border-slate-800">
                <td className="flex items-center gap-2 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {initials(u.fullName || u.username)}
                  </div>
                  {u.fullName}
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.username}</td>
                <td className="px-4 py-3">
                  <Pill className={u.role === 'Admin' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : ''}>
                    {u.role}
                  </Pill>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email || '-'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(u)}>
                    <Pill
                      className={
                        u.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }
                    >
                      {u.status}
                    </Pill>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Edit user"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setResetTarget(u)}
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                      title="Reset password"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} title="Create New User">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Full Name</label>
            <Input value={form.fullName} onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Username</label>
              <Input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Password</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Role</label>
              <Select value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value }))}>
                <option value="Developer">Developer</option>
                <option value="Admin">Admin</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
              <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCreating(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createUser.isPending}>
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit user: ${editTarget?.username}`}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Full Name</label>
            <Input value={editForm.fullName} onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="name@company.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Role</label>
              <Select value={editForm.role} onChange={(e) => setEditForm((s) => ({ ...s, role: e.target.value as Role }))}>
                <option value="Developer">Developer</option>
                <option value="Admin">Admin</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
              <Select
                value={editForm.status}
                onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value as 'Active' | 'Inactive' }))}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </div>
        {editError && (
          <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {editError}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditTarget(null)}>
            Cancel
          </Button>
          <Button onClick={handleEditSave} disabled={updateUser.isPending}>
            {updateUser.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password: ${resetTarget?.username}`}>
        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">New Password</label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        {error && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setResetTarget(null)}>
            Cancel
          </Button>
          <Button onClick={handleReset} disabled={resetPassword.isPending}>
            {resetPassword.isPending ? 'Saving...' : 'Reset Password'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
