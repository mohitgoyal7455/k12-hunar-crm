import { PAGE_SIZES } from './useInquiryParams';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
}

export function Pagination({ page, limit, total, totalPages, onPage, onLimit }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-line px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-slate" aria-live="polite">
        Showing <span className="font-bold text-ink tabular-nums">{from}–{to}</span> of{' '}
        <span className="font-bold text-ink tabular-nums">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <label className="flex items-center gap-2 text-slate">
          Rows
          <select
            value={limit}
            onChange={(e) => onLimit(Number(e.target.value))}
            className="rounded-md border border-line bg-white px-2 py-1.5 text-ink"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-ghost px-3 py-1.5 text-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="whitespace-nowrap tabular-nums text-slate">
          {page} / {totalPages}
        </span>
        <button type="button" className="btn-ghost px-3 py-1.5 text-sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
