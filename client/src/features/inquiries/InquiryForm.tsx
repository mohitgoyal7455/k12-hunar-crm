import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField } from '../../components/FormField';
import { Spinner } from '../../components/Spinner';
import { ApiError } from '../../lib/api';
import { CATEGORIES, USER_TYPES } from '../../lib/constants';
import { useSubmitInquiry } from './api';
import { inquiryFormSchema, type InquiryFormValues } from './schema';

interface InquiryFormProps {
  onSubmitted: (result: { reference: string; email: string }) => void;
}

const MESSAGE_MAX = 2000;
const FIELDS = ['userType', 'category', 'name', 'email', 'phone', 'message'] as const;

export function InquiryForm({ onSubmitted }: InquiryFormProps) {
  const submit = useSubmitInquiry();
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: { userType: undefined, category: undefined, name: '', email: '', phone: '', message: '', website: '' },
    mode: 'onTouched',
  });

  const messageLength = watch('message')?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await submit.mutateAsync(values);
      onSubmitted({ reference: result.reference, email: values.email.trim() });
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        // Show the server's field errors next to the matching inputs.
        for (const issue of err.details) {
          const field = FIELDS.find((f) => f === issue.field);
          if (field) setError(field, { message: issue.message }, { shouldFocus: true });
        }
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Could not send your inquiry. Try again.');
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="userType" label="I am a" error={errors.userType?.message}>
          {(a11y) => (
            <select {...a11y} {...register('userType')} defaultValue="" className="field-input">
              <option value="" disabled>
                Select one
              </option>
              {USER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField id="category" label="My question is about" error={errors.category?.message}>
          {(a11y) => (
            <select {...a11y} {...register('category')} defaultValue="" className="field-input">
              <option value="" disabled>
                Select a topic
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <FormField id="name" label="Full name" error={errors.name?.message}>
        {(a11y) => (
          <input {...a11y} {...register('name')} type="text" autoComplete="name" className="field-input" placeholder="Priya Sharma" />
        )}
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="email" label="Email" error={errors.email?.message}>
          {(a11y) => (
            <input
              {...a11y}
              {...register('email')}
              type="email"
              autoComplete="email"
              inputMode="email"
              className="field-input"
              placeholder="priya@example.com"
            />
          )}
        </FormField>

        <FormField id="phone" label="Mobile number" error={errors.phone?.message}>
          {(a11y) => (
            <input
              {...a11y}
              {...register('phone')}
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              className="field-input"
              placeholder="98100 12345"
            />
          )}
        </FormField>
      </div>

      <FormField id="message" label="Your question" error={errors.message?.message}>
        {(a11y) => (
          <>
            <textarea
              {...a11y}
              {...register('message')}
              rows={5}
              maxLength={MESSAGE_MAX}
              className="field-input resize-y"
              placeholder="For example: Is there a merit scholarship for Class 11 science students?"
            />
            <p className="mt-1 text-right text-xs text-slate tabular-nums" aria-live="polite">
              {messageLength}/{MESSAGE_MAX}
            </p>
          </>
        )}
      </FormField>

      {/* Honeypot: hidden from people and screen readers, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submit.isPending}>
        {submit.isPending ? (
          <>
            <Spinner /> Sending inquiry…
          </>
        ) : (
          'Send inquiry'
        )}
      </button>
      <p className="text-center text-sm text-slate">We only use your details to reply to this inquiry.</p>
    </form>
  );
}
