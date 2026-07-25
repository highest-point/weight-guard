import { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Database,
  Layout,
  Heart,
  RotateCcw,
  Check,
  ChevronRight,
  Volume2,
  VolumeX,
  Clock,
  Calendar,
  Footprints,
  Droplets,
  Flame,
  Scale,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useGlobalNotification } from '../context/NotificationContext';

/**
 * 设置模块组件
 */
export default function SettingsModule() {
  const {
    settings,
    updateNestedSettings,
    toggleTheme,
    setThemeColor,
    resetSettings,
    THEME_COLORS,
  } = useSettings();
  const showNotification = useGlobalNotification();
  const [activeSection, setActiveSection] = useState('theme');
  const [resetConfirm, setResetConfirm] = useState(false);

  /**
   * 切换开关
   */
  const ToggleSwitch = ({ enabled, onChange, label }) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors flex items-center justify-between px-1 ${
        enabled
          ? 'bg-indigo-600 dark:bg-indigo-500'
          : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
          enabled ? 'translate-x-6' : ''
        }`}
      />
    </button>
  );

  /**
   * 设置项组件
   */
  const SettingItem = ({ label, description, children, onClick }) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex-1">
        <div className="font-medium text-slate-800 dark:text-slate-100">{label}</div>
        {description && (
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  /**
   * 主题设置部分
   */
  const ThemeSection = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
            <Monitor className="text-indigo-600 dark:text-indigo-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">外观主题</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">选择应用的整体外观</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: '浅色', icon: Sun },
            { id: 'dark', label: '深色', icon: Moon },
            { id: 'system', label: '跟随系统', icon: Monitor },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => toggleTheme(item.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                settings.theme === item.id
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <item.icon
                size={24}
                className={settings.theme === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {item.label}
              </span>
              {settings.theme === item.id && (
                <Check className="text-indigo-600 dark:text-indigo-400" size={16} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
            <Heart className="text-purple-600 dark:text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">主题色彩</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">选择应用的主色调</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {Object.entries(THEME_COLORS).map(([key, color]) => (
            <button
              key={key}
              onClick={() => setThemeColor(key)}
              className={`relative p-3 rounded-xl border-2 transition-all ${
                settings.themeColor === key
                  ? 'border-slate-300 dark:border-slate-500 shadow-md'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{
                backgroundColor: `${color.primary}20`,
              }}
              title={color.name}
            >
              <div
                className="w-8 h-8 rounded-full mx-auto"
                style={{ backgroundColor: color.primary }}
              />
              {settings.themeColor === key && (
                <Check
                  className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 shadow-sm"
                  size={14}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * 通知设置部分
   */
  const NotificationSection = () => (
    <div className="space-y-4">
      <SettingItem
        label="通知开关"
        description="控制所有应用通知的开关"
      >
        <ToggleSwitch
          enabled={settings.notifications.enabled}
          onChange={(val) => updateNestedSettings('notifications', 'enabled', val)}
        />
      </SettingItem>

      {settings.notifications.enabled && (
        <>
          <SettingItem
            label="任务提醒"
            description="在任务截止前发送提醒通知"
          >
            <ToggleSwitch
              enabled={settings.notifications.taskReminders}
              onChange={(val) => updateNestedSettings('notifications', 'taskReminders', val)}
            />
          </SettingItem>

          <SettingItem
            label="体重记录提醒"
            description="提醒您每日记录体重数据"
          >
            <ToggleSwitch
              enabled={settings.notifications.weightReminders}
              onChange={(val) => updateNestedSettings('notifications', 'weightReminders', val)}
            />
          </SettingItem>

          <SettingItem
            label="每日总结"
            description="每日发送活动数据总结"
          >
            <ToggleSwitch
              enabled={settings.notifications.dailySummary}
              onChange={(val) => updateNestedSettings('notifications', 'dailySummary', val)}
            />
          </SettingItem>

          <SettingItem
            label="通知提示音"
            description="通知弹出时播放提示音"
          >
            <ToggleSwitch
              enabled={settings.notifications.soundEnabled}
              onChange={(val) => updateNestedSettings('notifications', 'soundEnabled', val)}
            />
          </SettingItem>

          <SettingItem
            label="自动关闭延迟"
            description={`通知显示 ${settings.notifications.autoCloseDelay / 1000} 秒后自动关闭`}
          >
            <div className="flex items-center gap-3">
              <select
                value={settings.notifications.autoCloseDelay}
                onChange={(e) => updateNestedSettings('notifications', 'autoCloseDelay', parseInt(e.target.value))}
                className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={2000}>2 秒</option>
                <option value={3000}>3 秒</option>
                <option value={5000}>5 秒</option>
                <option value={10000}>10 秒</option>
                <option value={0}>不自动关闭</option>
              </select>
            </div>
          </SettingItem>
        </>
      )}
    </div>
  );

  /**
   * 数据设置部分
   */
  const DataSection = () => (
    <div className="space-y-4">
      <SettingItem
        label="自动同步"
        description="自动将数据同步到云端"
      >
        <ToggleSwitch
          enabled={settings.data.autoSync}
          onChange={(val) => updateNestedSettings('data', 'autoSync', val)}
        />
      </SettingItem>

      <SettingItem
        label="同步间隔"
        description={`每 ${settings.data.syncInterval} 秒自动同步一次`}
      >
        <div className="flex items-center gap-3">
          <select
            value={settings.data.syncInterval}
            onChange={(e) => updateNestedSettings('data', 'syncInterval', parseInt(e.target.value))}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={30}>30 秒</option>
            <option value={60}>1 分钟</option>
            <option value={300}>5 分钟</option>
            <option value={600}>10 分钟</option>
          </select>
        </div>
      </SettingItem>

      <SettingItem
        label="数据保留期"
        description={`保留最近 ${settings.data.dataRetention} 天的数据`}
      >
        <div className="flex items-center gap-3">
          <select
            value={settings.data.dataRetention}
            onChange={(e) => updateNestedSettings('data', 'dataRetention', parseInt(e.target.value))}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={30}>30 天</option>
            <option value={90}>90 天</option>
            <option value={180}>6 个月</option>
            <option value={365}>1 年</option>
            <option value={730}>2 年</option>
          </select>
        </div>
      </SettingItem>

      <SettingItem
        label="显示周末"
        description="在日历和图表中显示周末"
      >
        <ToggleSwitch
          enabled={settings.data.showWeekends}
          onChange={(val) => updateNestedSettings('data', 'showWeekends', val)}
        />
      </SettingItem>

      <SettingItem
        label="一周起始日"
        description={settings.data.firstDayOfWeek === 1 ? '周一' : '周日'}
      >
        <div className="flex items-center gap-3">
          <select
            value={settings.data.firstDayOfWeek}
            onChange={(e) => updateNestedSettings('data', 'firstDayOfWeek', parseInt(e.target.value))}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>周一</option>
            <option value={0}>周日</option>
          </select>
        </div>
      </SettingItem>
    </div>
  );

  /**
   * 界面设置部分
   */
  const InterfaceSection = () => (
    <div className="space-y-4">
      <SettingItem
        label="紧凑模式"
        description="减少间距，显示更多内容"
      >
        <ToggleSwitch
          enabled={settings.interface.compactMode}
          onChange={(val) => updateNestedSettings('interface', 'compactMode', val)}
        />
      </SettingItem>

      <SettingItem
        label="显示头像"
        description="在侧边栏和列表中显示用户头像"
      >
        <ToggleSwitch
          enabled={settings.interface.showAvatars}
          onChange={(val) => updateNestedSettings('interface', 'showAvatars', val)}
        />
      </SettingItem>

      <SettingItem
        label="动画效果"
        description="启用页面和组件的过渡动画"
      >
        <ToggleSwitch
          enabled={settings.interface.animationEnabled}
          onChange={(val) => updateNestedSettings('interface', 'animationEnabled', val)}
        />
      </SettingItem>

      <SettingItem
        label="语言"
        description="应用界面语言"
      >
        <div className="flex items-center gap-3">
          <select
            value={settings.interface.language}
            onChange={(e) => updateNestedSettings('interface', 'language', e.target.value)}
            className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </SettingItem>
    </div>
  );

  /**
   * 健康目标部分
   */
  const HealthSection = () => (
    <div className="space-y-4">
      <SettingItem
        label="目标体重"
        description={`当前目标: ${settings.health.targetWeight} kg`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scale size={16} className="text-slate-400" />
            <input
              type="number"
              value={settings.health.targetWeight}
              onChange={(e) => updateNestedSettings('health', 'targetWeight', parseFloat(e.target.value))}
              className="w-20 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              min="30"
              max="200"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">kg</span>
          </div>
        </div>
      </SettingItem>

      <SettingItem
        label="每日热量目标"
        description={`当前目标: ${settings.health.dailyCalories} kcal`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-slate-400" />
            <input
              type="number"
              value={settings.health.dailyCalories}
              onChange={(e) => updateNestedSettings('health', 'dailyCalories', parseInt(e.target.value))}
              className="w-24 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              min="500"
              max="5000"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">kcal</span>
          </div>
        </div>
      </SettingItem>

      <SettingItem
        label="每日饮水目标"
        description={`当前目标: ${settings.health.dailyWater} ml`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-slate-400" />
            <input
              type="number"
              value={settings.health.dailyWater}
              onChange={(e) => updateNestedSettings('health', 'dailyWater', parseInt(e.target.value))}
              className="w-24 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              min="500"
              max="5000"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">ml</span>
          </div>
        </div>
      </SettingItem>

      <SettingItem
        label="每日步数目标"
        description={`当前目标: ${settings.health.dailySteps.toLocaleString()} 步`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Footprints size={16} className="text-slate-400" />
            <input
              type="number"
              value={settings.health.dailySteps}
              onChange={(e) => updateNestedSettings('health', 'dailySteps', parseInt(e.target.value))}
              className="w-24 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              min="1000"
              max="50000"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">步</span>
          </div>
        </div>
      </SettingItem>
    </div>
  );

  /**
   * 设置分类菜单
   */
  const sections = [
    { id: 'theme', label: '外观主题', icon: Monitor },
    { id: 'notification', label: '通知设置', icon: Bell },
    { id: 'data', label: '数据设置', icon: Database },
    { id: 'interface', label: '界面设置', icon: Layout },
    { id: 'health', label: '健康目标', icon: Heart },
  ];

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
          <Layout className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            个性化设置
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            自定义您的应用体验
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 侧边导航 */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 sticky top-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === section.id
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <section.icon size={18} />
                  {section.label}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setResetConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <RotateCcw size={18} />
                重置为默认设置
              </button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1">
          {activeSection === 'theme' && <ThemeSection />}
          {activeSection === 'notification' && <NotificationSection />}
          {activeSection === 'data' && <DataSection />}
          {activeSection === 'interface' && <InterfaceSection />}
          {activeSection === 'health' && <HealthSection />}
        </div>
      </div>

      {/* 重置确认弹窗 */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-96 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="text-red-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                确认重置设置？
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                此操作将把所有设置恢复为默认值，您的自定义设置将丢失。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setResetConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    resetSettings();
                    setResetConfirm(false);
                    showNotification('success', '设置已重置为默认值');
                  }}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
