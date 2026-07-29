import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2, UserCog } from 'lucide-react';
import { StatusBadge, BreachBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import type { Role, Task } from '@/lib/types';

const columnHelper = createColumnHelper<Task>();

export function TaskTable({
  tasks,
  role,
  onEdit,
  onDelete,
  onAssign,
}: {
  tasks: Task[];
  role: Role;
  onEdit: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onAssign?: (task: Task) => void;
}) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const categories = useMemo(() => [...new Set(tasks.map((t) => t.category).filter(Boolean))].sort(), [tasks]);
  const phases = useMemo(() => [...new Set(tasks.map((t) => t.phase).filter(Boolean))].sort(), [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (phaseFilter && t.phase !== phaseFilter) return false;
      if (statusFilter && t.apiStatus !== statusFilter) return false;
      return true;
    });
  }, [tasks, categoryFilter, phaseFilter, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('category', { header: 'Category' }),
      columnHelper.accessor('phase', { header: 'Phase' }),
      columnHelper.accessor('apiName', { header: 'API Name' }),
      columnHelper.accessor('developer', { header: "Api's" }),
      columnHelper.accessor('apiStatus', {
        header: 'API Status',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <StatusBadge status={info.getValue()} />
            <BreachBadge days={info.row.original.breach.api.days} />
          </div>
        ),
      }),
      columnHelper.accessor('apiDate', { header: 'API Date', cell: (info) => formatDate(info.getValue()) }),
      columnHelper.accessor('deployment', { header: 'Deployment' }),
      columnHelper.accessor('deploymentStatus', {
        header: 'Deploy Status',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <StatusBadge status={info.getValue()} />
            <BreachBadge days={info.row.original.breach.deployment.days} />
          </div>
        ),
      }),
      columnHelper.accessor('deploymentDate', { header: 'Deploy Date', cell: (info) => formatDate(info.getValue()) }),
      columnHelper.accessor('mobileIntegration', { header: 'Mobile Integration' }),
      columnHelper.accessor('mobileStatus', {
        header: 'Mobile Status',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <StatusBadge status={info.getValue()} />
            <BreachBadge days={info.row.original.breach.mobile.days} />
          </div>
        ),
      }),
      columnHelper.accessor('mobileIntegrationDate', { header: 'Mobile Date', cell: (info) => formatDate(info.getValue()) }),
      columnHelper.accessor('webIntegration', { header: 'Web Integration' }),
      columnHelper.accessor('webStatus', {
        header: 'Web Status',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <StatusBadge status={info.getValue()} />
            <BreachBadge days={info.row.original.breach.web.days} />
          </div>
        ),
      }),
      columnHelper.accessor('webIntegrationDate', { header: 'Web Date', cell: (info) => formatDate(info.getValue()) }),
      columnHelper.accessor('remarks', {
        header: 'Remarks',
        cell: (info) => <span className="line-clamp-2 max-w-[160px] text-xs text-slate-500">{info.getValue() || '-'}</span>,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: (info) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(info.row.original)}
              className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
              title="Edit"
            >
              <Pencil size={15} />
            </button>
            {role === 'Admin' && onAssign && (
              <button
                onClick={() => onAssign(info.row.original)}
                className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10"
                title="Reassign"
              >
                <UserCog size={15} />
              </button>
            )}
            {role === 'Admin' && onDelete && (
              <button
                onClick={() => onDelete(info.row.original)}
                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ),
      }),
    ],
    [role, onEdit, onDelete, onAssign]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search API, developer, category..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)} className="max-w-[140px]">
          <option value="">All Phases</option>
          {phases.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[160px]">
          <option value="">All Statuses</option>
          {['Pending', 'In Progress', 'Completed', 'Blocked', 'On Hold'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} of {tasks.length} APIs</span>
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer whitespace-nowrap border-b border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <ArrowUp size={12} />}
                      {header.column.getIsSorted() === 'desc' && <ArrowDown size={12} />}
                      {!header.column.getIsSorted() && header.column.id !== 'actions' && (
                        <ArrowUpDown size={12} className="opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-3 py-2.5 text-slate-700 dark:text-slate-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-sm text-slate-400">
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft size={14} /> Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
