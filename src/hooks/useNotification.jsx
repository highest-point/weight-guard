import { useState, useEffect, useCallback } from 'react';

/**
 * Notification Hook - 简化通知调用
 * @returns {{ showNotification: (type, message, autoClose?) => void, notificationState: { isOpen, type, message, autoClose }, hideNotification: () => void }}
 */
export const useNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('info');
  const [message, setMessage] = useState('');
  const [autoClose, setAutoClose] = useState(3000);

  const showNotification = useCallback((notificationType, notificationMessage, closeTime = 3000) => {
    setType(notificationType);
    setMessage(notificationMessage);
    setAutoClose(closeTime);
    setIsOpen(true);
  }, []);

  const hideNotification = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    showNotification,
    hideNotification,
    notificationState: { isOpen, type, message, autoClose },
  };
};

/**
 * XIcon 组件 - 用于关闭按钮
 */
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/**
 * Notification 组件 - 用于显示通知
 */
export const NotificationComponent = ({ isOpen, type, message, autoClose, onClose }) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose && autoClose > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 200);
        }, autoClose);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, autoClose, onClose]);

  const getStyles = () => {
    const base = 'rounded-xl border shadow-lg p-4 flex items-start gap-3 transition-all duration-300';
    switch (type) {
      case 'success':
        return `${base} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400`;
      case 'error':
        return `${base} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400`;
      case 'warning':
        return `${base} bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400`;
      case 'info':
      default:
        return `${base} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30 text-blue-700 dark:text-blue-400`;
    }
  };

  const getIcon = () => {
    const Icon = {
      success: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      error: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
      warning: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      info: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      ),
    };
    return Icon[type]?.() || Icon.info();
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed top-20 right-6 z-[100] transition-all duration-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
      <div className={`${getStyles()} max-w-sm`}>
        <div className="shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 200);
          }}
          className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
};