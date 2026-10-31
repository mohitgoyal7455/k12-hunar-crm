import { STATUS_LABEL, type Status } from '../../lib/constants';

const STYLES: Record<Status, string> = {
  new: 'bg-marigold/15 text-[#7a5300] ring-marigold/40',
  in_progress: 'bg-ink/8 text-ink ring-ink/20',
  resolved: 'bg-leaf/10 text-leaf ring-leaf/30',
  closed: 'bg-slate/10 text-slate ring-slate/25',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${STYLES[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
