interface PaginationProps {
  currentPage: number;
  totalPages: number;
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, count, hasNext, hasPrevious, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-violet-50/40 border-t border-violet-100">
      <span className="text-xs font-bold text-violet-900/60">
        {count} result{count === 1 ? "" : "s"} · Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl border border-violet-200 text-violet-800 bg-white hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition"
        >
          ← Previous
        </button>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3.5 py-1.5 text-xs font-extrabold rounded-xl border border-violet-200 text-violet-800 bg-white hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
