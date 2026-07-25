import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PaginationControls = ({ currentPage, totalPages, totalCount, onPrev, onNext, unitName }) => (
  <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800 mt-auto">
    <span className="text-[10px] text-slate-400 dark:text-slate-500">共 <span className="font-bold text-slate-600 dark:text-slate-300">{totalCount}</span> {unitName}</span>
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 dark:text-slate-500">{currentPage} / {totalPages} 页</span>
      <div className="flex gap-1">
        <button onClick={onPrev} disabled={currentPage === 1} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
          <ChevronLeft size={14} className="text-slate-600 dark:text-slate-400" />
        </button>
        <button onClick={onNext} disabled={currentPage >= totalPages} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
          <ChevronRight size={14} className="text-slate-600 dark:text-slate-400" />
        </button>
      </div>
    </div>
  </div>
);