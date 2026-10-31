import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiBlob, apiJson, buildQuery } from '../../lib/api';
import type { Category, Status, UserType } from '../../lib/constants';
import type { InquiryFormValues } from './schema';

export interface Inquiry {
  id: number;
  userType: UserType;
  category: Category;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryFilters {
  category?: Category | '';
  userType?: UserType | '';
  status?: Status | '';
  search?: string;
  sort?: 'created_at' | 'name';
  order?: 'asc' | 'desc';
}

export interface InquiryList {
  data: Inquiry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface InquiryStats {
  total: number;
  last7Days: number;
  byStatus: Record<Status, number>;
  byCategory: Record<Category, number>;
}

export const inquiryKeys = {
  all: ['inquiries'] as const,
  list: (params: InquiryFilters & { page: number; limit: number }) => ['inquiries', 'list', params] as const,
  stats: ['inquiries', 'stats'] as const,
};

// ------------------------------------------------------------- public

export function useSubmitInquiry() {
  return useMutation({
    mutationFn: (values: InquiryFormValues) =>
      apiJson<{ id: number; reference: string }>('/inquiries', { method: 'POST', body: values }),
  });
}

// -------------------------------------------------------------- admin

export function useInquiries(params: InquiryFilters & { page: number; limit: number }) {
  return useQuery({
    queryKey: inquiryKeys.list(params),
    queryFn: ({ signal }) =>
      apiJson<InquiryList>(`/inquiries${buildQuery({ ...params })}`, { auth: true, signal }),
    placeholderData: keepPreviousData, // keep the table on screen while the next page loads
  });
}

export function useInquiryStats() {
  return useQuery({
    queryKey: inquiryKeys.stats,
    queryFn: ({ signal }) => apiJson<InquiryStats>('/inquiries/stats', { auth: true, signal }),
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: Status }) =>
      apiJson<Inquiry>(`/inquiries/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: inquiryKeys.all }),
  });
}

export function useDeleteInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiJson<void>(`/inquiries/${id}`, { method: 'DELETE', auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: inquiryKeys.all }),
  });
}

export async function downloadInquiriesCsv(filters: InquiryFilters) {
  const { blob, filename } = await apiBlob(`/inquiries/export${buildQuery({ ...filters })}`, { auth: true });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
