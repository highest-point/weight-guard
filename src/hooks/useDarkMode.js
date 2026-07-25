import { useState, useEffect, useCallback } from 'react';

/**
 * 暗色模式管理 Hook
 * 持久化存储到 localStorage，支持系统偏好检测
 * @returns {{ isDarkMode: boolean, toggleDarkMode: () => void }} 暗色模式状态和切换方法
 */
export const useDarkMode = () => {
  /**
   * 检测系统是否偏好暗色模式
   * @returns {boolean} 是否偏好暗色模式
   */
  const getSystemDarkMode = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  /**
   * 从 localStorage 获取保存的暗色模式设置
   * @returns {boolean} 保存的暗色模式状态
   */
  const getSavedDarkMode = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return getSystemDarkMode();
  };

  const [isDarkMode, setIsDarkMode] = useState(getSavedDarkMode);

  /**
   * 切换暗色模式
   */
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  }, []);

  /**
   * 同步暗色模式到 document
   */
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return { isDarkMode, toggleDarkMode };
};