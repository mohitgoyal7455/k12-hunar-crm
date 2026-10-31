import { useEffect, useRef } from 'react';

interface InquirySuccessProps {
  reference: string;
  email: string;
  onReset: () => void;
}

export function InquirySuccess({ reference, email, onReset }: InquirySuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus so screen-reader and keyboard users land on the confirmation.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="py-6 text-center" role="status">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-leaf/10 text-leaf">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
        Inquiry sent
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-slate">
        We&rsquo;ll reply to <span className="font-bold text-ink">{email}</span> within one working day.
        Quote this reference if you contact us:
      </p>
      <p className="mt-4 inline-block rounded-lg border border-dashed border-ink/30 px-4 py-2 font-display text-xl font-bold tracking-wide tabular-nums">
        {reference}
      </p>
      <div className="mt-8">
        <button type="button" onClick={onReset} className="btn-ghost">
          Send another inquiry
        </button>
      </div>
    </div>
  );
}
