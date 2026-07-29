import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, apiErrorMessage } from '@/lib/api';

async function downloadExport(format: 'csv' | 'xlsx' | 'pdf') {
  const res = await api.get(`/export/${format}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `api-tasks.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportExportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage('');
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(res.data.message);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      setError(apiErrorMessage(err, 'Import failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Import Excel / CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Uploading a file will <span className="font-semibold">replace all current API rows</span> in the Google Sheet
            with the rows found in the file. Columns must follow the same order as the original sheet
            (# , API Name, Category, Phase, Api's, Status, Api Date, Deployment, Status, Deployment Date, Mobile
            Integration, Status, Mobile Integration Date, Web Integration, Status, Web Integration Date).
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            <UploadCloud size={16} /> {uploading ? 'Importing...' : 'Choose file to import'}
          </Button>

          {message && (
            <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Current Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            Download the current task list in your preferred format.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadExport('csv')}>
              <Download size={16} /> CSV
            </Button>
            <Button variant="outline" onClick={() => downloadExport('xlsx')}>
              <FileSpreadsheet size={16} /> Excel
            </Button>
            <Button variant="outline" onClick={() => downloadExport('pdf')}>
              <Download size={16} /> PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
