import { z } from 'zod';

export const USER_TYPES = ['parent', 'student', 'school'] as const;
export const CATEGORIES = ['scholarship', 'concert', 'admission', 'general_query'] as const;
export const STATUSES = ['new', 'in_progress', 'resolved', 'closed'] as const;

export type UserType = (typeof USER_TYPES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];

/**
 * Accepts "98100 12345", "+91-9810012345", "09810012345" etc. and
 * returns the bare 10-digit Indian mobile number.
 */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

// Treat "" in query strings as "not provided".
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToUndefined, z.enum(values).optional());

export const createInquirySchema = z.object({
  userType: z.enum(USER_TYPES, { message: 'Select a user type' }),
  category: z.enum(CATEGORIES, { message: 'Select a category' }),
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address').max(255)),
  phone: z
    .string({ message: 'Phone number is required' })
    .transform(normalizePhone)
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')),
  message: z
    .string({ message: 'Message is required' })
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters'),
  // Honeypot: real users never see or fill this field.
  website: z.string().optional(),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;

export const listInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: optionalEnum(CATEGORIES),
  userType: optionalEnum(USER_TYPES),
  status: optionalEnum(STATUSES),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(['created_at', 'name']).default('created_at')),
  order: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
});

export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
export type InquiryFilters = Omit<ListInquiriesQuery, 'page' | 'limit'>;

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}` }),
});

export const idParamSchema = z.object({
  id: z.coerce.number({ message: 'Invalid inquiry id' }).int('Invalid inquiry id').positive('Invalid inquiry id'),
});
