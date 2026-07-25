/**
 * 全局搜索组件
 * 支持搜索任务、笔记、事件，实时搜索结果，支持快捷键 Ctrl+K 唤起
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowRight, Clock, FileText, Calendar, Hash } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';

const GlobalSearch = ({ isOpen, onClose, onNavigate, user }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  // 获取任务数据
  const getTasks = useCallback(async () => {
    if (!user?.uid) return [];
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tasks');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().list || [] : [];
  }, [user]);

  // 获取笔记数据
  const getNotes = useCallback(async () => {
    if (!user?.uid) return [];
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().list || [] : [];
  }, [user]);

  // 搜索执行
  const executeSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const lowerQuery = searchQuery.toLowerCase();
    const searchResults = [];

    try {
      // 搜索任务
      const tasks = await getTasks();
      if (tasks) {
        tasks
          .filter(task => 
            (task.title?.toLowerCase().includes(lowerQuery) || 
             task.description?.toLowerCase().includes(lowerQuery)) &&
            !task.deleted
          )
          .slice(0, 5)
          .forEach(task => {
            searchResults.push({
              id: task.id,
              type: 'task',
              title: task.title,
              subtitle: task.description || '无描述',
              icon: Clock,
              color: 'text-blue-500',
              bgColor: 'bg-blue-100 dark:bg-blue-900/20',
              action: () => {
                onNavigate('tasks');
                onClose();
              }
            });
          });
      }

      // 搜索笔记
      const notes = await getNotes();
      if (notes) {
        notes
          .filter(note => 
            (note.title?.toLowerCase().includes(lowerQuery) || 
             note.content?.toLowerCase().includes(lowerQuery)) &&
            !note.deleted
          )
          .slice(0, 5)
          .forEach(note => {
            searchResults.push({
              id: note.id,
              type: 'note',
              title: note.title || '无标题笔记',
              subtitle: note.content?.substring(0, 50) + (note.content?.length > 50 ? '...' : '') || '无内容',
              icon: FileText,
              color: 'text-purple-500',
              bgColor: 'bg-purple-100 dark:bg-purple-900/20',
              action: () => {
                onNavigate('notes');
                onClose();
              }
            });
          });
      }

      // 搜索标签
      const tags = new Set();
      if (tasks) {
        tasks.forEach(task => {
          task.tags?.forEach(tag => {
            if (tag.toLowerCase().includes(lowerQuery)) {
              tags.add(tag);
            }
          });
        });
      }
      if (notes) {
        notes.forEach(note => {
          note.tags?.forEach(tag => {
            if (tag.toLowerCase().includes(lowerQuery)) {
              tags.add(tag);
            }
          });
        });
      }
      
      Array.from(tags).slice(0, 3).forEach(tag => {
        searchResults.push({
          id: `tag-${tag}`,
          type: 'tag',
          title: `#${tag}`,
          subtitle: '搜索此标签',
          icon: Hash,
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          action: () => {
            onNavigate('tasks');
            onClose();
          }
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getTasks, getNotes, onNavigate, onClose]);

  // 监听搜索词变化
  useEffect(() => {
    const debounce = setTimeout(() => {
      executeSearch(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, executeSearch]);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : prev
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].action();
          }
          break;
        case 'Escape':
          onClose();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  const groupedResults = {
    tasks: results.filter(r => r.type === 'task'),
    notes: results.filter(r => r.type === 'note'),
    tags: results.filter(r => r.type === 'tag'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 搜索面板 */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 搜索输入框 */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索任务、笔记、标签..."
            className="flex-1 bg-transparent text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg">
            ESC
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              {query ? (
                <>
                  <Search size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">未找到匹配的结果</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">尝试使用其他关键词搜索</p>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <button 
                      onClick={() => { onNavigate('tasks'); onClose(); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Clock size={20} className="text-blue-500" />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">任务</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate('notes'); onClose(); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <FileText size={20} className="text-purple-500" />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">笔记</span>
                    </button>
                    <button 
                      onClick={() => { onNavigate('dashboard'); onClose(); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <Calendar size={20} className="text-green-500" />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300">日历</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 dark:text-slate-500">输入关键词开始搜索</p>
                </>
              )}
            </div>
          ) : (
            <div className="py-2">
              {groupedResults.tasks.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    任务
                  </div>
                  {groupedResults.tasks.map((result, idx) => {
                    const globalIndex = results.indexOf(result);
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={result.action}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          globalIndex === selectedIndex 
                            ? 'bg-slate-100 dark:bg-slate-800' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${result.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={18} className={result.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                            {result.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        <ArrowRight size={16} className={`${
                          globalIndex === selectedIndex ? 'text-indigo-500 opacity-100' : 'opacity-0'
                        } transition-opacity`} />
                      </button>
                    );
                  })}
                </div>
              )}

              {groupedResults.notes.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    笔记
                  </div>
                  {groupedResults.notes.map((result, idx) => {
                    const globalIndex = results.indexOf(result);
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={result.action}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          globalIndex === selectedIndex 
                            ? 'bg-slate-100 dark:bg-slate-800' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${result.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={18} className={result.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100 truncate">
                            {result.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        <ArrowRight size={16} className={`${
                          globalIndex === selectedIndex ? 'text-indigo-500 opacity-100' : 'opacity-0'
                        } transition-opacity`} />
                      </button>
                    );
                  })}
                </div>
              )}

              {groupedResults.tags.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    标签
                  </div>
                  {groupedResults.tags.map((result, idx) => {
                    const globalIndex = results.indexOf(result);
                    const Icon = result.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={result.action}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          globalIndex === selectedIndex 
                            ? 'bg-slate-100 dark:bg-slate-800' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl ${result.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={18} className={result.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {result.title}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {result.subtitle}
                          </p>
                        </div>
                        <ArrowRight size={16} className={`${
                          globalIndex === selectedIndex ? 'text-indigo-500 opacity-100' : 'opacity-0'
                        } transition-opacity`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部快捷键提示 */}
        {results.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd>
                导航
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd>
                选择
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">ESC</kbd>
              关闭
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export { GlobalSearch };
