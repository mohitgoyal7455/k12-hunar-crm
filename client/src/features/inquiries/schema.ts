import { z } from 'zod';

// Mirrors server/src/schemas/inquiry.ts so users see errors before submitting.
// The server re-validates everything; this is for UX only.

const normalizePhone = (raw: string) => {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
};

export const inquiryFormSchema = z.object({
  userType: z.enum(['parent', 'student', 'school'], { message: 'Choose who is asking' }),
  category: z.enum(['scholarship', 'concert', 'admission', 'general_query'], {
    message: 'Choose what your question is about',
  }),
  name: z
    .string()
    .trim()
    .min(2, 'Enter your name (at least 2 characters)')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().pipe(z.email('Enter an email like name@example.com')),
  phone: z
    .string()
    .refine((v) => /^[6-9]\d{9}$/.test(normalizePhone(v)), 'Enter a 10-digit mobile number, e.g. 98100 12345'),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a little more (at least 10 characters)')
    .max(2000, 'Keep your message under 2000 characters'),
  website: z.string().optional(), // honeypot
});

export type InquiryFormValues = z.input<typeof inquiryFormSchema>;
