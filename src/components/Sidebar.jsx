import { useState } from 'react';
import { Layout, LayoutDashboard, Calendar, Activity, FileText, User, Settings, PanelLeftClose, PanelLeft, Bell } from 'lucide-react';

const menu = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard, color: 'bg-blue-500' },
  { id: 'tasks', label: '任务计划', icon: Calendar, color: 'bg-orange-500' },
  { id: 'weight', label: '体重管理', icon: Activity, color: 'bg-green-500' },
  { id: 'notes', label: '云端记事本', icon: FileText, color: 'bg-purple-500' },
  { id: 'settings', label: '个性化设置', icon: Settings, color: 'bg-slate-500' },
  { id: 'profile', label: '个人中心', icon: User, color: 'bg-indigo-500' },
];

export const Sidebar = ({ activeTab, onTabChange, user, isOpen, isDarkMode }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <div 
      className={`h-full shadow-xl z-20 transition-all duration-300 ease-out flex-shrink-0 ${
        isOpen ? 'w-72' : 'w-20'
      }`}
      style={{
        background: isDarkMode 
          ? 'linear-gradient(180deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
      }}
    >
      <div className={`h-full flex flex-col transition-all duration-300 ${isOpen ? 'w-72' : 'w-20'}`}>
        {/* Logo区域 */}
        <div className={`p-4 ${isOpen ? 'flex items-center gap-3' : 'flex justify-center'}`}>
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all duration-300">
              <Layout size={isOpen ? 24 : 20} />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 shadow-sm ${isDarkMode ? 'border-slate-800' : 'border-white'}`} />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <h1 className={`font-bold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>每日计划</h1>
              <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Daily Planner</span>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {menu.map((item) => {
            const isActive = activeTab === item.id;
            const isHovered = hoveredItem === item.id;
            
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => onTabChange(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm relative overflow-hidden ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : `${isDarkMode ? 'text-slate-300 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`
                  }`}
                >
                  {/* 活动状态指示条 */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-xl" />
                  )}
                  
                  {/* 图标 */}
                  <div className={`relative p-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-indigo-500/20 text-indigo-400' 
                      : isHovered 
                        ? `${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'}` 
                        : 'text-slate-400'
                  }`}>
                    <item.icon size={isOpen ? 18 : 20} />
                    {/* 图标光晕效果 */}
                    {isActive && (
                      <div className="absolute inset-0 bg-indigo-500/30 rounded-lg blur-md opacity-50 -z-10" />
                    )}
                  </div>
                  
                  {/* 文字 */}
                  {isOpen && (
                    <span className={`transition-all duration-200 ${
                      isActive ? 'font-semibold' : ''
                    }`}>
                      {item.label}
                    </span>
                  )}
                  
                  {/* 悬浮时的动画波纹 */}
                  <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
                    isHovered && !isActive ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-xl ${
                      isDarkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'
                    }`} />
                  </div>
                </button>
                
                {/* 折叠时的提示 */}
                {!isOpen && isHovered && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50">
                    <div className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap ${
                      isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {item.label}
                      <div className={`absolute left-0 top-1/2 -translate-x-1 w-2 h-2 rotate-45 ${
                        isDarkMode ? 'bg-slate-700' : 'bg-slate-800'
                      }`} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 底部用户区域 */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-100'} ${isOpen ? '' : 'flex justify-center'}`}>
          <div 
            className={`cursor-pointer rounded-xl p-2 transition-all duration-200 ${
              isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'
            } ${isOpen ? 'flex items-center gap-3' : ''}`}
            onClick={() => onTabChange('profile')}
          >
            <div className="relative">
              <div className={`w-10 h-10 rounded-full overflow-hidden shadow-md ring-2 ${isDarkMode ? 'ring-slate-800' : 'ring-white'}`}>
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 shadow-sm ${isDarkMode ? 'border-slate-800' : 'border-white'}`} />
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{user.displayName}</div>
                <div className={`flex items-center gap-1 text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span>数据同步在线</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
