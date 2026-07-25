/**
 * 页面切换动画组件
 * 添加平滑过渡效果
 */

import { useState, useEffect } from 'react';

const PageTransition = ({ children, isLoading, view }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevView, setPrevView] = useState(view);

  // 监听视图变化，触发动画
  useEffect(() => {
    if (view !== prevView) {
      setIsAnimating(true);
      
      // 动画开始后立即更新prevView
      const timer = setTimeout(() => {
        setPrevView(view);
      }, 150);

      // 动画结束后恢复状态
      const endTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);

      return () => {
        clearTimeout(timer);
        clearTimeout(endTimer);
      };
    }
  }, [view, prevView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin" />
          <div className="absolute inset-0 w-10 h-10 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* 当前页面 */}
      <div
        className={`
          absolute inset-0 transition-all duration-300 ease-in-out
          ${isAnimating ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
        `}
      >
        {children}
      </div>

      {/* 加载指示器（视图切换时显示） */}
      {isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 页面标题动画 */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

/**
 * 元素进场动画组件
 */
const FadeIn = ({ children, delay = 0, className = '' }) => (
  <div 
    className={`opacity-0 animate-fade-in ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

/**
 * 元素滑入动画组件
 */
const SlideIn = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const directions = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: '-translate-x-4',
    right: 'translate-x-4',
  };

  return (
    <div 
      className={`opacity-0 ${directions[direction]} animate-slide-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/**
 * 元素缩放动画组件
 */
const ScaleIn = ({ children, delay = 0, className = '' }) => (
  <div 
    className={`opacity-0 scale-95 animate-scale-in ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export { PageTransition, FadeIn, SlideIn, ScaleIn };
