import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Spinner } from '../../components/Spinner';
import { CATEGORY_LABEL, STATUSES, STATUS_LABEL, USER_TYPE_LABEL, type Status } from '../../lib/constants';
import { formatDateTime, formatPhone } from '../../lib/format';
import { useDeleteInquiry, useUpdateStatus, type Inquiry } from './api';

interface InquiryDialogProps {
  inquiry: Inquiry | null;
  onClose: () => void;
}

/**
 * Uses the native <dialog> element: showModal() gives a real focus trap,
 * Esc to close, inert background and focus restoration for free.
 */
export function InquiryDialog({ inquiry, onClose }: InquiryDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<Inquiry | null>(inquiry);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateStatus = useUpdateStatus();
  const deleteInquiry = useDeleteInquiry();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (inquiry) {
      setCurrent(inquiry);
      setConfirmDelete(false);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [inquiry]);

  const changeStatus = async (status: Status) => {
    if (!current || status === current.status) return;
    try {
      const updated = await updateStatus.mutateAsync({ id: current.id, status });
      setCurrent(updated);
      toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const remove = async () => {
    if (!current) return;
    try {
      await deleteInquiry.mutateAsync(current.id);
      toast.success('Inquiry deleted');
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()} // click on backdrop
      aria-labelledby="inquiry-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-line bg-white p-0 text-ink shadow-xl backdrop:bg-ink/40"
    >
      {current && (
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate tabular-nums">INQ-{String(current.id).padStart(6, '0')}</p>
              <h2 id="inquiry-dialog-title" className="mt-0.5 text-2xl font-bold">
                {current.name}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="-mr-2 rounded-lg p-2 text-slate hover:bg-paper hover:text-ink" aria-label="Close">
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-[15px]">
            <Detail label="Phone">
              <a href={`tel:+91${current.phone}`} className="underline underline-offset-2 tabular-nums">
                {formatPhone(current.phone)}
              </a>
            </Detail>
            <Detail label="Email">
              <a href={`mailto:${current.email}`} className="break-all underline underline-offset-2">
                {current.email}
              </a>
            </Detail>
            <Detail label="User type">{USER_TYPE_LABEL[current.userType]}</Detail>
            <Detail label="Category">{CATEGORY_LABEL[current.category]}</Detail>
            <Detail label="Received">{formatDateTime(current.createdAt)}</Detail>
            <Detail label="Last updated">{formatDateTime(current.updatedAt)}</Detail>
          </dl>

          <div className="mt-6">
            <h3 className="text-sm text-slate">Message</h3>
            <p className="mt-1.5 rounded-lg bg-paper p-4 leading-relaxed whitespace-pre-wrap">{current.message}</p>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label htmlFor="dialog-status" className="field-label">
                Status
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="dialog-status"
                  value={current.status}
                  onChange={(e) => changeStatus(e.target.value as Status)}
                  disabled={updateStatus.isPending}
                  className="field-input w-44"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {updateStatus.isPending && <Spinner />}
              </div>
            </div>

            {confirmDelete ? (
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </button>
                <button type="button" className="btn bg-rose text-white hover:bg-rose/90" onClick={remove} disabled={deleteInquiry.isPending} autoFocus>
                  {deleteInquiry.isPending ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            ) : (
              <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                Delete inquiry
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-slate">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
