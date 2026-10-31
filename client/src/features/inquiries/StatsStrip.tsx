import { CATEGORY_LABEL, type Category } from '../../lib/constants';
import { useInquiryStats } from './api';

export function StatsStrip() {
  const { data, isPending, isError } = useInquiryStats();

  if (isError) return null; // the table below shows the actionable error

  const figures = [
    { label: 'Total inquiries', value: data?.total },
    { label: 'Received in the last 7 days', value: data?.last7Days },
    { label: 'Waiting for a first reply', value: data?.byStatus.new },
    { label: 'In progress', value: data?.byStatus.in_progress },
  ];

  return (
    <section aria-label="Inquiry summary" className="overflow-hidden rounded-2xl border border-line bg-white">
      <dl className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {figures.map((f) => (
          <div key={f.label} className="bg-white px-4 py-4 sm:px-5">
            <dt className="text-sm text-slate">{f.label}</dt>
            <dd className="mt-1 font-display text-3xl font-bold tabular-nums">
              {isPending ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-line" /> : f.value}
            </dd>
          </div>
        ))}
      </dl>
      {data && (
        <p className="border-t border-line px-4 py-3 text-sm text-slate sm:px-5">
          By topic:{' '}
          {(Object.entries(data.byCategory) as [Category, number][]).map(([cat, n], i, arr) => (
            <span key={cat}>
              <span className="font-bold text-ink">{CATEGORY_LABEL[cat]}</span> {n}
              {i < arr.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
