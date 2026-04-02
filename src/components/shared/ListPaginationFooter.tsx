import { ChevronLeft, ChevronRight } from 'lucide-react';

import { PAGE_SIZE_OPTIONS } from '../../lib/useClientListPagination';

type ListPaginationFooterProps = {
  entityLabel: string;
  totalItems: number;
  sliceStart: number;
  rangeEnd: number;
  page: number;
  safePage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function ListPaginationFooter({
  entityLabel,
  totalItems,
  sliceStart,
  rangeEnd,
  page,
  safePage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ListPaginationFooterProps) {
  return (
    <div className="px-4 sm:px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/35 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-on-surface-variant tabular-nums">
        {totalItems === 0
          ? `No ${entityLabel} to show`
          : `Showing ${sliceStart + 1}–${rangeEnd} of ${totalItems} ${entityLabel}`}
      </span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="flex items-center gap-2 text-[11px] font-bold text-outline uppercase tracking-wider">
          Per page
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-outline-variant/30 bg-white px-2 py-1.5 text-sm font-semibold text-on-surface shadow-sm"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/30 bg-white/80 text-on-surface shadow-sm hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none"
            disabled={safePage <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-22 text-center text-sm font-semibold text-on-surface tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/30 bg-white/80 text-on-surface shadow-sm hover:bg-surface-container-low disabled:opacity-40 disabled:pointer-events-none"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
