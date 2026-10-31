import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { InquiryForm } from '../features/inquiries/InquiryForm';
import { InquirySuccess } from '../features/inquiries/InquirySuccess';
import { CATEGORIES } from '../lib/constants';

const NEXT_STEPS = [
  'You send your question using this form.',
  'The right person on our team reads it — admissions, scholarships or events.',
  'We reply by email or phone within one working day.',
];

export function InquiryPage() {
  const [sent, setSent] = useState<{ reference: string; email: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Left: context panel. On phones it shrinks to a header and the
          explanatory sections move below the form. */}
      <aside className="bg-ink text-white lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <div className="mx-auto flex h-full max-w-xl flex-col px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
          <Logo tone="light" />

          <div className="mt-10 lg:mt-16">
            <h1 className="text-[2.5rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-[3.6rem]">
              Ask us anything about your child&rsquo;s learning.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/75">
              Parents, students and schools write to us every day. Tell us what you need and the right
              person will get back to you.
            </p>
          </div>

          <section className="mt-12 hidden lg:block" aria-labelledby="topics-heading">
            <TopicGuide />
          </section>

          <p className="mt-auto hidden pt-10 text-sm text-white/50 lg:block">
            <span className="mr-4">© {new Date().getFullYear()} K12 Hunar</span>
            <Link to="/admin/login" className="underline underline-offset-2 hover:text-white">
              Staff login
            </Link>
          </p>
        </div>
      </aside>

      <main className="px-4 py-8 sm:px-8 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_0_#dfe3ee] sm:p-8">
            {sent ? (
              <InquirySuccess
                reference={sent.reference}
                email={sent.email}
                onReset={() => {
                  setSent(null);
                  setFormKey((k) => k + 1);
                }}
              />
            ) : (
              <>
                <h2 className="text-2xl font-bold">Send an inquiry</h2>
                <p className="mt-1 mb-7 text-slate">All fields are required.</p>
                <InquiryForm key={formKey} onSubmitted={setSent} />
              </>
            )}
          </div>

          <section className="mt-12" aria-labelledby="next-heading">
            <h2 id="next-heading" className="text-xl font-bold">
              What happens next
            </h2>
            <ol className="mt-5 space-y-4">
              {NEXT_STEPS.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink font-display text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-slate">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12 rounded-2xl bg-ink p-6 text-white lg:hidden" aria-labelledby="topics-heading-m">
            <TopicGuide headingId="topics-heading-m" />
          </section>

          <p className="mt-10 text-center text-sm text-slate lg:hidden">
            <span className="mr-4">© {new Date().getFullYear()} K12 Hunar</span>
            <Link to="/admin/login" className="underline underline-offset-2">
              Staff login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function TopicGuide({ headingId = 'topics-heading' }: { headingId?: string }) {
  return (
    <>
      <h2 id={headingId} className="text-lg font-bold text-marigold">
        Not sure which topic to pick?
      </h2>
      <dl className="mt-4 divide-y divide-white/10">
        {CATEGORIES.map((c) => (
          <div key={c.value} className="py-3.5">
            <dt className="font-bold">{c.label}</dt>
            <dd className="mt-0.5 text-white/70">{c.hint}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
