import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Badge';
import { initials } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white">
            {initials(user.fullName || user.username)}
          </div>
          <div>
            <CardTitle className="text-lg">{user.fullName || user.username}</CardTitle>
            <Pill className="mt-1">{user.role}</Pill>
          </div>
        </CardHeader>
        <CardContent className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Username</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{user.username}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Email</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{user.email || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Role</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{user.role}</span>
          </div>
        </CardContent>
      </Card>
      <p className="mt-3 text-xs text-slate-400">To change your password, contact your Admin.</p>
    </div>
  );
}
