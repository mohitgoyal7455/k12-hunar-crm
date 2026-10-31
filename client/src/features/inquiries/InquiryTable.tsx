import { CATEGORY_LABEL, USER_TYPE_LABEL } from '../../lib/constants';
import { formatDate, formatPhone } from '../../lib/format';
import type { Inquiry, InquiryFilters } from './api';
import { StatusBadge } from './StatusBadge';

interface InquiryTableProps {
  rows: Inquiry[];
  sort: InquiryFilters['sort'];
  order: InquiryFilters['order'];
  onSort: (column: 'created_at' | 'name') => void;
  onOpen: (inquiry: Inquiry) => void;
  dimmed?: boolean;
}

export function InquiryTable({ rows, sort, order, onSort, onOpen, dimmed }: InquiryTableProps) {
  return (
    <div className={dimmed ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {/* Tablet and up: real table */}
      <table className="hidden w-full text-left text-[15px] md:table">
        <caption className="sr-only">Inquiries. Select a row to see the full message and change its status.</caption>
        <thead className="border-b border-line text-sm text-slate">
          <tr>
            <SortHeader label="Name" column="name" sort={sort} order={order} onSort={onSort} />
            <th scope="col" className="px-4 py-3 font-bold">Phone</th>
            <th scope="col" className="px-4 py-3 font-bold">Email</th>
            <th scope="col" className="px-4 py-3 font-bold">User type</th>
            <th scope="col" className="px-4 py-3 font-bold">Category</th>
            <SortHeader label="Date" column="created_at" sort={sort} order={order} onSort={onSort} />
            <th scope="col" className="px-4 py-3 font-bold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onOpen(r)}
              className="cursor-pointer hover:bg-paper focus-within:bg-paper"
            >
              <td className="px-4 py-3.5">
                {/* The name is a real button so keyboard users can open the row. */}
                <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(r); }} className="text-left font-bold hover:underline">
                  {r.name}
                </button>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap tabular-nums">{formatPhone(r.phone)}</td>
              <td className="max-w-[16rem] truncate px-4 py-3.5 text-slate" title={r.email}>{r.email}</td>
              <td className="px-4 py-3.5">{USER_TYPE_LABEL[r.userType]}</td>
              <td className="px-4 py-3.5">{CATEGORY_LABEL[r.category]}</td>
              <td className="px-4 py-3.5 whitespace-nowrap text-slate">{formatDate(r.createdAt)}</td>
              <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phones: stacked list */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => onOpen(r)} className="block w-full px-4 py-4 text-left hover:bg-paper">
              <span className="flex items-start justify-between gap-3">
                <span className="font-bold">{r.name}</span>
                <StatusBadge status={r.status} />
              </span>
              <span className="mt-1 block text-sm text-slate tabular-nums">
                {formatPhone(r.phone)} <span aria-hidden="true">/</span> {r.email}
              </span>
              <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>{USER_TYPE_LABEL[r.userType]}</span>
                <span>{CATEGORY_LABEL[r.category]}</span>
                <span className="text-slate">{formatDate(r.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SortHeaderProps {
  label: string;
  column: 'created_at' | 'name';
  sort: InquiryFilters['sort'];
  order: InquiryFilters['order'];
  onSort: (column: 'created_at' | 'name') => void;
}

function SortHeader({ label, column, sort, order, onSort }: SortHeaderProps) {
  const active = sort === column;
  const ariaSort = active ? (order === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort} className="px-4 py-3 font-bold">
      <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        <svg viewBox="0 0 12 12" className={`size-3 ${active ? 'text-ink' : 'text-slate/50'}`} aria-hidden="true">
          <path d="M6 2 9 5H3z" fill="currentColor" opacity={active && order === 'asc' ? 1 : 0.35} />
          <path d="M6 10 3 7h6z" fill="currentColor" opacity={active && order === 'desc' ? 1 : 0.35} />
        </svg>
      </button>
    </th>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading inquiries" className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-6 px-4 py-4">
          <span className="h-4 w-36 animate-pulse rounded bg-line" />
          <span className="hidden h-4 w-24 animate-pulse rounded bg-line md:block" />
          <span className="hidden h-4 w-44 animate-pulse rounded bg-line md:block" />
          <span className="ml-auto h-5 w-20 animate-pulse rounded-full bg-line" />
        </div>
      ))}
    </div>
  );
}
