/**
 * 页面切换动画组件
 * 添加平滑过渡效果
 */

import { useState, useEffect } from 'react';

const PageTransition = ({ children, view }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevView, setPrevView] = useState(view);

  // 监听视图变化，触发动画
  useEffect(() => {
    if (view !== prevView) {
      setIsAnimating(true);
      
      // 动画结束后恢复状态
      const endTimer = setTimeout(() => {
        setIsAnimating(false);
        setPrevView(view);
      }, 300);

      return () => clearTimeout(endTimer);
    }
  }, [view, prevView]);

  return (
    <div className="relative">
      {/* 当前页面 */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
        `}
      >
        {children}
      </div>
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
