/**
 * 快捷键支持组件
 * 全局快捷键监听和提示
 */

import { useState, useEffect, useCallback } from 'react';
import { Keyboard, X, Command } from 'lucide-react';

const KeyboardShortcuts = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 快捷键配置
  const shortcuts = [
    {
      keys: ['Ctrl', 'K'],
      description: '打开全局搜索',
      action: () => document.dispatchEvent(new CustomEvent('open-search')),
      category: '导航',
    },
    {
      keys: ['Ctrl', '1'],
      description: '跳转到仪表盘',
      action: () => onNavigate('dashboard'),
      category: '导航',
    },
    {
      keys: ['Ctrl', '2'],
      description: '跳转到任务管理',
      action: () => onNavigate('tasks'),
      category: '导航',
    },
    {
      keys: ['Ctrl', '3'],
      description: '跳转到体重管理',
      action: () => onNavigate('weight'),
      category: '导航',
    },
    {
      keys: ['Ctrl', '4'],
      description: '跳转到笔记',
      action: () => onNavigate('notes'),
      category: '导航',
    },
    {
      keys: ['Ctrl', 'S'],
      description: '保存当前内容',
      action: () => document.dispatchEvent(new CustomEvent('save-content')),
      category: '操作',
    },
    {
      keys: ['Ctrl', 'N'],
      description: '新建项目',
      action: () => document.dispatchEvent(new CustomEvent('create-new')),
      category: '操作',
    },
    {
      keys: ['Escape'],
      description: '关闭弹窗/返回',
      action: () => document.dispatchEvent(new CustomEvent('close-modal')),
      category: '操作',
    },
    {
      keys: ['?'],
      description: '显示快捷键帮助',
      action: () => setIsOpen(true),
      category: '帮助',
    },
  ];

  // 按类别分组
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  // 处理键盘事件
  const handleKeyDown = useCallback((e) => {
    // 忽略在输入框中按下的快捷键
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    
    // Ctrl+K - 打开搜索
    if ((e.ctrlKey || e.metaKey) && key === 'k') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('open-search'));
    }

    // Ctrl+1-4 - 导航
    if ((e.ctrlKey || e.metaKey) && ['1', '2', '3', '4'].includes(key)) {
      e.preventDefault();
      const navMap = { '1': 'dashboard', '2': 'tasks', '3': 'weight', '4': 'notes' };
      onNavigate(navMap[key]);
    }

    // ? - 显示帮助
    if (key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setIsOpen(true);
    }

    // Escape - 关闭帮助
    if (key === 'escape') {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  }, [onNavigate, isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* 快捷键帮助面板 */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
              <Keyboard size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">键盘快捷键</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">提高您的操作效率</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((shortcut, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                  >
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((k, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-slate-400 mx-1">+</span>}
                          <kbd className="px-2 py-1 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-200">
                            {k === 'Ctrl' ? <Command size={12} /> : k}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            按 <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-600 dark:text-slate-200">?</kbd> 随时显示此帮助
          </p>
        </div>
      </div>
    </div>
  );
};

export { KeyboardShortcuts };
