import { createContext, useContext } from 'react';

/**
 * 全局通知 Context
 * 提供全局通知功能，所有组件都可以通过此 Context 发送通知
 */
export const NotificationContext = createContext(null);

/**
 * 自定义 Hook - 获取全局通知函数
 * @returns {(type: string, message: string, autoClose?: number) => void} 通知函数
 */
export const useGlobalNotification = () => {
  const showNotification = useContext(NotificationContext);
  if (!showNotification) {
    console.warn('useGlobalNotification must be used within a NotificationContext.Provider');
    return () => {};
  }
  return showNotification;
};