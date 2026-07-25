/**
 * 骨架屏组件
 * 用于加载状态时的占位展示
 */

const Skeleton = ({ className = '', variant = 'rect' }) => {
  const variants = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md',
  };

  return (
    <div
      className={`
        animate-pulse bg-slate-200 dark:bg-slate-700
        ${variants[variant]}
        ${className}
      `}
    />
  );
};

/**
 * 卡片骨架屏
 */
const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
    <div className="flex items-center gap-4 mb-6">
      <Skeleton variant="circle" className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-5 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton variant="text" className="h-4 w-full" />
      <Skeleton variant="text" className="h-4 w-5/6" />
      <Skeleton variant="text" className="h-4 w-4/6" />
    </div>
  </div>
);

/**
 * 统计卡片骨架屏
 */
const StatCardSkeleton = ({ className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton variant="circle" className="w-12 h-12" />
      <Skeleton variant="text" className="h-6 w-16" />
    </div>
    <Skeleton variant="text" className="h-10 w-1/2 mb-2" />
    <Skeleton variant="text" className="h-4 w-1/3" />
  </div>
);

/**
 * 列表项骨架屏
 */
const ListItemSkeleton = ({ className = '' }) => (
  <div className={`flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ${className}`}>
    <Skeleton variant="circle" className="w-10 h-10" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="h-5 w-4/5" />
      <Skeleton variant="text" className="h-4 w-2/5" />
    </div>
    <Skeleton variant="text" className="h-5 w-20" />
  </div>
);

export { Skeleton, CardSkeleton, StatCardSkeleton, ListItemSkeleton };
