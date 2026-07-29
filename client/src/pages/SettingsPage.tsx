import { Moon, Sun, ExternalLink } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</p>
            <p className="text-xs text-slate-400">Switch between light and dark themes</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Switch to Light' : 'Switch to Dark'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>This portal reads and writes directly to your Google Sheet — no database is used.</p>
          <p className="text-slate-400">Sheet connection is managed by the server administrator via environment variables.</p>
        </CardContent>
      </Card>

      {user?.role === 'Admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Google Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={`https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SHEET_ID || ''}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Open source spreadsheet <ExternalLink size={14} />
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
