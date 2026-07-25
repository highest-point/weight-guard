import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * 默认设置配置
 */
const DEFAULT_SETTINGS = {
  // 主题设置
  theme: 'system', // 'light', 'dark', 'system'
  themeColor: 'indigo', // 'indigo', 'blue', 'purple', 'pink', 'orange', 'green', 'teal'
  
  // 通知设置
  notifications: {
    enabled: true,
    taskReminders: true,
    weightReminders: true,
    dailySummary: true,
    soundEnabled: false,
    autoCloseDelay: 3000,
  },
  
  // 数据设置
  data: {
    autoSync: true,
    syncInterval: 60, // 秒
    dataRetention: 365, // 天
    showWeekends: true,
    firstDayOfWeek: 1, // 0=周日, 1=周一
  },
  
  // 界面设置
  interface: {
    sidebarCollapsed: false,
    compactMode: false,
    showAvatars: true,
    animationEnabled: true,
    language: 'zh-CN', // 'zh-CN', 'en-US'
  },
  
  // 健康目标
  health: {
    targetWeight: 65, // kg
    dailyCalories: 2000, // kcal
    dailyWater: 2000, // ml
    dailySteps: 10000,
  },
};

/**
 * 主题色配置
 */
export const THEME_COLORS = {
  indigo: {
    primary: '#6366f1',
    secondary: '#818cf8',
    bgGradient: 'from-indigo-500 to-purple-600',
    name: '靛蓝色',
  },
  blue: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    bgGradient: 'from-blue-500 to-cyan-600',
    name: '蓝色',
  },
  purple: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    bgGradient: 'from-purple-500 to-pink-600',
    name: '紫色',
  },
  pink: {
    primary: '#ec4899',
    secondary: '#f472b6',
    bgGradient: 'from-pink-500 to-rose-600',
    name: '粉色',
  },
  orange: {
    primary: '#f97316',
    secondary: '#fb923c',
    bgGradient: 'from-orange-500 to-amber-600',
    name: '橙色',
  },
  green: {
    primary: '#22c55e',
    secondary: '#4ade80',
    bgGradient: 'from-green-500 to-emerald-600',
    name: '绿色',
  },
  teal: {
    primary: '#14b8a6',
    secondary: '#2dd4bf',
    bgGradient: 'from-teal-500 to-cyan-600',
    name: '青色',
  },
};

/**
 * 全局设置 Context
 */
export const SettingsContext = createContext(null);

/**
 * 获取存储的设置
 */
const getStoredSettings = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
  }
  return DEFAULT_SETTINGS;
};

/**
 * 设置 Provider 组件
 */
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(getStoredSettings);

  /**
   * 保存设置到 localStorage
   */
  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  /**
   * 更新设置
   */
  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  /**
   * 更新嵌套设置
   */
  const updateNestedSettings = useCallback((section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }, []);

  /**
   * 重置为默认设置
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  /**
   * 切换主题模式
   */
  const toggleTheme = useCallback((newTheme) => {
    setSettings((prev) => {
      const updated = { ...prev, theme: newTheme };
      
      // 更新 document 的 dark 类
      if (typeof window !== 'undefined') {
        const isDark = newTheme === 'dark' || 
          (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      return updated;
    });
  }, []);

  /**
   * 设置主题色
   */
  const setThemeColor = useCallback((color) => {
    setSettings((prev) => ({ ...prev, themeColor: color }));
  }, []);

  /**
   * 获取当前是否为暗色模式
   */
  const isDarkMode = useCallback(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    // 跟随系统
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [settings.theme]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateNestedSettings,
        resetSettings,
        toggleTheme,
        setThemeColor,
        isDarkMode,
        THEME_COLORS,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * 自定义 Hook - 获取设置
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    console.warn('useSettings must be used within a SettingsProvider');
    return {
      settings: DEFAULT_SETTINGS,
      updateSettings: () => {},
      updateNestedSettings: () => {},
      resetSettings: () => {},
      toggleTheme: () => {},
      setThemeColor: () => {},
      isDarkMode: () => false,
      THEME_COLORS,
    };
  }
  return context;
};
