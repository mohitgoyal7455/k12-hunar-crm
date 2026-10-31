export const USER_TYPES = [
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Student' },
  { value: 'school', label: 'School' },
] as const;

export const CATEGORIES = [
  {
    value: 'scholarship',
    label: 'Scholarship',
    hint: 'Eligibility, documents and deadlines for merit or need-based support.',
  },
  {
    value: 'concert',
    label: 'Concert',
    hint: 'Performing, registering a school group, or attending our events.',
  },
  {
    value: 'admission',
    label: 'Admission',
    hint: 'Seats, fees, mid-year joining and the enrolment process.',
  },
  {
    value: 'general_query',
    label: 'General Query',
    hint: 'Anything else — classes, timings, partnerships, feedback.',
  },
] as const;

export const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const;

export type UserType = (typeof USER_TYPES)[number]['value'];
export type Category = (typeof CATEGORIES)[number]['value'];
export type Status = (typeof STATUSES)[number]['value'];

const toMap = <T extends readonly { value: string; label: string }[]>(list: T) =>
  Object.fromEntries(list.map((i) => [i.value, i.label])) as Record<T[number]['value'], string>;

export const USER_TYPE_LABEL = toMap(USER_TYPES);
export const CATEGORY_LABEL = toMap(CATEGORIES);
export const STATUS_LABEL = toMap(STATUSES);
