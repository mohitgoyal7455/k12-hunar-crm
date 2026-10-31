import { useEffect, useRef, useState } from 'react';
import { CATEGORIES, STATUSES, USER_TYPES, type Category, type Status, type UserType } from '../../lib/constants';
import type { useInquiryParams } from './useInquiryParams';

type Params = ReturnType<typeof useInquiryParams>;

interface FiltersBarProps {
  params: Params;
  onExport: () => void;
  exporting: boolean;
}

export function FiltersBar({ params, onExport, exporting }: FiltersBarProps) {
  const { category, userType, status, search, update, clearFilters, hasFilters } = params;

  // Local state so typing feels instant; the URL (and the request) update
  // 300 ms after the user stops typing.
  const [term, setTerm] = useState(search);
  const lastPushed = useRef(search);

  // Sync only when the URL changed from elsewhere (e.g. "Clear filters"),
  // never because of our own debounced push — that would eat keystrokes.
  useEffect(() => {
    if (search !== lastPushed.current) {
      lastPushed.current = search;
      setTerm(search);
    }
  }, [search]);

  useEffect(() => {
    const next = term.trim();
    if (next === lastPushed.current) return;
    const t = setTimeout(() => {
      lastPushed.current = next;
      update({ search: next });
    }, 300);
    return () => clearTimeout(t);
  }, [term, update]);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label htmlFor="search" className="field-label">
          Search by name or phone
        </label>
        <div className="relative">
          <svg className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <input
            id="search"
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. Priya or 98100"
            className="field-input pl-9"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:flex">
        <FilterSelect
          id="filter-category"
          label="Category"
          value={category}
          options={CATEGORIES}
          allLabel="All categories"
          onChange={(v) => update({ category: v as Category | '' })}
        />
        <FilterSelect
          id="filter-userType"
          label="User type"
          value={userType}
          options={USER_TYPES}
          allLabel="All user types"
          onChange={(v) => update({ userType: v as UserType | '' })}
        />
        <FilterSelect
          id="filter-status"
          label="Status"
          value={status}
          options={STATUSES}
          allLabel="All statuses"
          onChange={(v) => update({ status: v as Status | '' })}
        />
      </div>

      <div className="flex gap-3">
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="btn-ghost flex-1 lg:flex-none">
            Clear filters
          </button>
        )}
        <button type="button" onClick={onExport} disabled={exporting} className="btn-ghost flex-1 lg:flex-none">
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  allLabel: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ id, label, value, allLabel, options, onChange }: FilterSelectProps) {
  return (
    <div className="min-w-0 lg:w-40">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field-input truncate pr-7">
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
