import { useCallback, useEffect, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export function useClientListPagination(itemCount: number) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(PAGE_SIZE_OPTIONS[1]);

  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(itemCount / pageSize));
    setPage((p) => Math.min(p, maxPage));
  }, [itemCount, pageSize]);

  const sliceStart = (safePage - 1) * pageSize;
  const rangeEnd = itemCount === 0 ? 0 : Math.min(sliceStart + pageSize, itemCount);

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(1);
  }, []);

  const sliceItems = useCallback(
    <T,>(items: T[]) => items.slice(sliceStart, sliceStart + pageSize),
    [sliceStart, pageSize],
  );

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    safePage,
    totalPages,
    sliceStart,
    rangeEnd,
    sliceItems,
    totalItems: itemCount,
  };
}
