/**
 * Toast组件 - 更丰富的通知样式和动画效果
 */

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

// Toast类型配置
const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    iconColor: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    iconColor: 'text-blue-500',
  },
  loading: {
    icon: Loader2,
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-900/30',
    textColor: 'text-indigo-700 dark:text-indigo-400',
    iconColor: 'text-indigo-500',
  },
};

// Toast上下文
import { createContext, useContext } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    console.warn('useToast must be used within a ToastProvider');
    return () => {};
  }
  return showToast;
};

/**
 * 单个Toast组件
 */
const ToastItem = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const Icon = config.icon;

  // 进场动画
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // 自动关闭
    if (toast.autoClose && toast.type !== 'loading') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
      }, toast.autoClose);
      return () => clearTimeout(timer);
    }
  }, [toast.autoClose, toast.type, onRemove]);

  // 手动关闭
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onRemove, 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
        ${isExiting ? 'translate-x-full' : ''}
      `}
    >
      {/* 图标 */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon 
          size={20} 
          className={`${config.iconColor} ${toast.type === 'loading' ? 'animate-spin' : ''}`} 
        />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="font-semibold text-sm mb-0.5">{toast.title}</h4>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {toast.message}
        </p>
        
        {/* 进度条 */}
        {toast.progress && (
          <div className="mt-3 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${toast.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 关闭按钮 */}
      {toast.type !== 'loading' && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

/**
 * Toast容器组件
 */
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onRemove={() => onRemove(toast.id)} 
        />
      ))}
    </div>
  );
};

/**
 * Toast提供者组件
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((options) => {
    const toast = {
      id: Date.now() + Math.random(),
      type: 'info',
      autoClose: 3000,
      ...options,
    };

    setToasts((prev) => [...prev, toast]);

    // 返回关闭函数
    return () => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    };
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * 便捷方法
 */
export const toast = {
  success: (message, options = {}) => ({
    type: 'success',
    message,
    ...options,
  }),
  error: (message, options = {}) => ({
    type: 'error',
    message,
    ...options,
  }),
  warning: (message, options = {}) => ({
    type: 'warning',
    message,
    ...options,
  }),
  info: (message, options = {}) => ({
    type: 'info',
    message,
    ...options,
  }),
  loading: (message, options = {}) => ({
    type: 'loading',
    message,
    autoClose: 0,
    ...options,
  }),
};
