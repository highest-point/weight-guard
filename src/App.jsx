import { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { PanelLeft, PanelLeftClose, Sun, Moon, Loader2, Search, Bell, ChevronDown, User, Settings, LogOut, BookOpen, Zap, X } from 'lucide-react';
import { useAuth, useAuthActions } from './hooks/useAuth';
import { useNotification, NotificationComponent } from './hooks/useNotification';
import { NotificationContext } from './context/NotificationContext';
import { SettingsProvider, useSettings, THEME_COLORS, BACKGROUND_STYLES, FONT_FAMILIES } from './context/SettingsContext';
import { Sidebar } from './components/Sidebar';
import { ProfileModule } from './components/ProfileModule';

import AuthPage from './pages/AuthPage';

// 路由懒加载 - 按需加载模块
const TaskModule = lazy(() => import('./modules/TaskModule'));
const WeightModule = lazy(() => import('./modules/WeightModule'));
const NoteModule = lazy(() => import('./modules/NoteModule'));
const DashboardModule = lazy(() => import('./modules/DashboardModule'));
const SettingsModule = lazy(() => import('./modules/SettingsModule'));

/**
 * 加载中组件 - 在模块懒加载时显示
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="animate-spin text-indigo-600" size={32} />
  </div>
);

/**
 * 主应用组件内部
 * 管理全局状态、认证、主题切换和页面路由
 */
function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { signOutUser } = useAuthActions();
  const { showNotification, notificationState, hideNotification } = useNotification();
  const { isDarkMode, toggleTheme, settings } = useSettings();
  
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  

  // 同步主题设置到文档
  useEffect(() => {
    const isDark = isDarkMode();
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 应用主题色
    Object.keys(THEME_COLORS).forEach(color => {
      document.documentElement.classList.remove(`theme-${color}`);
    });
    document.documentElement.classList.add(`theme-${settings.themeColor}`);
  }, [isDarkMode, settings.themeColor]);

  // 认证加载中显示loading
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center dark:bg-slate-950">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  // 未登录显示登录页面
  if (!user) {
    return <AuthPage />;
  }

  /**
   * 根据当前视图返回页面标题
   * @returns {string} 页面标题
   */
  const getPageTitle = () => {
    const titles = {
      dashboard: '数据仪表盘',
      tasks: '任务计划中心',
      weight: '健康体重管理',
      notes: '云端记事本',
      settings: '个性化设置',
      profile: '个人中心'
    };
    return titles[view] || '每日计划';
  };

  /**
   * 根据当前视图渲染对应的模块
   * @returns {React.ReactNode} 当前视图的模块组件
   */
  const renderModule = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardModule user={user} onNavigate={setView} isDarkMode={isDarkMode()} />;
      case 'tasks':
        return <TaskModule user={user} isDarkMode={isDarkMode()} />;
      case 'weight':
        return <WeightModule user={user} isDarkMode={isDarkMode()} />;
      case 'notes':
        return <NoteModule user={user} isDarkMode={isDarkMode()} />;
      case 'settings':
        return <SettingsModule />;
      case 'profile':
        return <ProfileModule user={user} onLogout={signOutUser} onNavigate={setView} />;
      default:
        return <DashboardModule user={user} onNavigate={setView} isDarkMode={isDarkMode()} />;
    }
  };

  return (
    <NotificationContext.Provider value={showNotification}>
      <div 
        className={`flex h-screen font-sans text-slate-600 dark:text-slate-300 overflow-hidden transition-colors duration-300 ${BACKGROUND_STYLES[settings.background]?.className}`}
        style={{ fontFamily: FONT_FAMILIES[settings.fontFamily]?.fontFamily }}
      >
        <Sidebar activeTab={view} onTabChange={setView} user={user} isOpen={isSidebarOpen} isDarkMode={isDarkMode()} />

        <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">
          <header className="h-16 px-6 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 z-10 sticky top-0 transition-all duration-300">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-all hover:scale-105">
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
              </button>
              
              {/* 面包屑 */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 dark:text-slate-500">
                  <BookOpen size={14} />
                </span>
                <span className="text-slate-500 dark:text-slate-400">首页</span>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{getPageTitle()}</span>
              </div>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-3">
              {/* 搜索框 */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="搜索任务、笔记..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all hover:border-slate-300 dark:hover:border-slate-600" 
                />
              </div>

              {/* 通知按钮 */}
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105"
                >
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                
                {/* 通知下拉菜单 */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100">通知中心</h3>
                      <span className="text-xs text-slate-400 dark:text-slate-500">3 条未读通知</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {/* 通知列表 */}
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                            <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">任务即将到期</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">您有 2 个任务将在今天到期</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">5 分钟前</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                            <Zap size={16} className="text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">体重记录提醒</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">今天还未记录体重数据</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">1 小时前</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">周报已生成</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">您的本周个人成长报告已生成</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">昨天</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                      <button className="w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                        查看全部通知
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 主题切换 */}
              <button
                onClick={() => toggleTheme(settings.theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-105"
                title={isDarkMode() ? '切换到浅色模式' : '切换到深色模式'}
              >
                {isDarkMode() ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-500" />}
              </button>

              {/* 用户菜单 */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-1.5 pl-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-800">
                    {user.photoURL ? (
                      <img src={user.photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                        {user.displayName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.displayName}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">在线</div>
                  </div>
                  <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
                </button>
                
                {/* 用户下拉菜单 */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95">
                    <button 
                      onClick={() => { setView('profile'); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-3"
                    >
                      <User size={16} /> 个人中心
                    </button>
                    <button 
                      onClick={() => { setView('settings'); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-3"
                    >
                      <Settings size={16} /> 个性化设置
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700" />
                    <button 
                      onClick={() => { signOutUser(); setShowUserMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                    >
                      <LogOut size={16} /> 退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 overflow-hidden">
            <div className="h-full overflow-y-auto pb-20 custom-scrollbar">
              <Suspense fallback={<LoadingSpinner />}>
                {renderModule()}
              </Suspense>
            </div>
          </div>
        </main>
      </div>
      
      <NotificationComponent {...notificationState} onClose={hideNotification} />
    </NotificationContext.Provider>
  );
}

/**
 * 主应用组件
 * 包装在 SettingsProvider 中
 */
export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}