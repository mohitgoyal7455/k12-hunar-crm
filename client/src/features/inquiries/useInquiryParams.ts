import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES, STATUSES, USER_TYPES, type Category, type Status, type UserType } from '../../lib/constants';
import type { InquiryFilters } from './api';

const PAGE_SIZES = [10, 25, 50] as const;
export { PAGE_SIZES };

const oneOf = <T extends string>(value: string | null, allowed: readonly { value: T }[]): T | '' =>
  allowed.some((a) => a.value === value) ? (value as T) : '';

/**
 * Dashboard filters live in the URL (?category=…&page=2), so a refresh,
 * the back button, or a shared link restores the same view.
 */
export function useInquiryParams() {
  const [params, setParams] = useSearchParams();

  const state = useMemo(() => {
    const limitRaw = Number(params.get('limit'));
    const pageRaw = Number(params.get('page'));
    return {
      category: oneOf<Category>(params.get('category'), CATEGORIES),
      userType: oneOf<UserType>(params.get('userType'), USER_TYPES),
      status: oneOf<Status>(params.get('status'), STATUSES),
      search: params.get('search') ?? '',
      sort: (params.get('sort') === 'name' ? 'name' : 'created_at') as InquiryFilters['sort'],
      order: (params.get('order') === 'asc' ? 'asc' : 'desc') as InquiryFilters['order'],
      page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
      limit: (PAGE_SIZES as readonly number[]).includes(limitRaw) ? limitRaw : 10,
    };
  }, [params]);

  /** Update some params. Any change other than `page` resets to page 1. */
  const update = useCallback(
    (patch: Partial<typeof state>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === '' || v === undefined || v === null) next.delete(k);
            else next.set(k, String(v));
          }
          if (!('page' in patch)) next.delete('page');
          if (next.get('page') === '1') next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clearFilters = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams();
        for (const keep of ['sort', 'order', 'limit']) {
          const v = prev.get(keep);
          if (v) next.set(keep, v);
        }
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  const hasFilters = Boolean(state.category || state.userType || state.status || state.search);

  return { ...state, update, clearFilters, hasFilters };
}
