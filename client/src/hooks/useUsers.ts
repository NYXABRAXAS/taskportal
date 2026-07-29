import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AppUser } from '@/lib/types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ users: AppUser[] }>('/users');
      return res.data.users;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { username: string; password: string; role: string; fullName: string; email: string; status: string }) => {
      const res = await api.post('/users', payload);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rowNumber, patch }: { rowNumber: number; patch: Partial<AppUser> }) => {
      const res = await api.put(`/users/${rowNumber}`, patch);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ rowNumber, password }: { rowNumber: number; password: string }) => {
      const res = await api.post(`/users/${rowNumber}/reset-password`, { password });
      return res.data;
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rowNumber: number) => {
      await api.delete(`/users/${rowNumber}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
