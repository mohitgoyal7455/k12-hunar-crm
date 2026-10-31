import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';
import { useAuth } from '../features/auth/AuthContext';
import { downloadInquiriesCsv, useInquiries, type Inquiry } from '../features/inquiries/api';
import { FiltersBar } from '../features/inquiries/FiltersBar';
import { InquiryDialog } from '../features/inquiries/InquiryDialog';
import { InquiryTable, TableSkeleton } from '../features/inquiries/InquiryTable';
import { Pagination } from '../features/inquiries/Pagination';
import { StatsStrip } from '../features/inquiries/StatsStrip';
import { useInquiryParams } from '../features/inquiries/useInquiryParams';

export default function DashboardPage() {
  const { state, logout } = useAuth();
  const params = useInquiryParams();
  const { category, userType, status, search, sort, order, page, limit, update } = params;
  const filters = { category, userType, status, search, sort, order };

  const query = useInquiries({ ...filters, page, limit });
  const [open, setOpen] = useState<Inquiry | null>(null);
  const [exporting, setExporting] = useState(false);

  // If filters shrink the result set below the current page, jump back.
  const totalPages = query.data?.pagination.totalPages ?? 1;
  useEffect(() => {
    if (query.data && page > totalPages) update({ page: totalPages });
  }, [query.data, page, totalPages, update]);

  const onSort = (column: 'created_at' | 'name') => {
    const nextOrder = sort === column ? (order === 'asc' ? 'desc' : 'asc') : column === 'name' ? 'asc' : 'desc';
    update({ sort: column, order: nextOrder });
  };

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadInquiriesCsv(filters);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo to="/admin" />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate sm:inline">
              Signed in as <span className="font-bold text-ink">{state.admin?.name}</span>
            </span>
            <button type="button" onClick={logout} className="btn-ghost px-3 py-1.5 text-sm">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>

        <StatsStrip />

        <FiltersBar params={params} onExport={onExport} exporting={exporting} />

        <section aria-label="Inquiry list" className="overflow-hidden rounded-2xl border border-line bg-white">
          {query.isPending ? (
            <TableSkeleton />
          ) : query.isError ? (
            <div role="alert" className="px-6 py-14 text-center">
              <h2 className="text-lg font-bold">Inquiries couldn&rsquo;t be loaded</h2>
              <p className="mx-auto mt-1 max-w-md text-slate">{query.error.message}</p>
              <button type="button" onClick={() => query.refetch()} className="btn-ink mt-5">
                Try again
              </button>
            </div>
          ) : query.data.data.length === 0 ? (
            <EmptyState filtered={params.hasFilters} onClear={params.clearFilters} />
          ) : (
            <>
              <InquiryTable
                rows={query.data.data}
                sort={sort}
                order={order}
                onSort={onSort}
                onOpen={setOpen}
                dimmed={query.isPlaceholderData}
              />
              <Pagination
                {...query.data.pagination}
                onPage={(p) => update({ page: p })}
                onLimit={(l) => update({ limit: l })}
              />
            </>
          )}
        </section>
      </main>

      <InquiryDialog inquiry={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="px-6 py-14 text-center">
      {filtered ? (
        <>
          <h2 className="text-lg font-bold">No inquiries match these filters</h2>
          <p className="mt-1 text-slate">Try a different search term or remove a filter.</p>
          <button type="button" onClick={onClear} className="btn-ink mt-5">
            Clear filters
          </button>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold">No inquiries yet</h2>
          <p className="mt-1 text-slate">New submissions from the public inquiry form will appear here.</p>
          <a href="/" target="_blank" rel="noreferrer" className="btn-ghost mt-5">
            Open the inquiry form
          </a>
        </>
      )}
    </div>
  );
}
