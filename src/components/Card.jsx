/**
 * 通用卡片组件
 * 支持渐变背景、悬浮动画、阴影层次等效果
 */

const Card = ({ 
  children, 
  className = '', 
  gradient = 'none', 
  hover = true, 
  padding = 'p-6',
  onClick,
  border = true,
  ...props 
}) => {
  // 渐变背景配置
  const gradients = {
    'none': '',
    'blue': 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    'purple': 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    'green': 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    'orange': 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    'red': 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
    'teal': 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20',
    'indigo': 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
  };

  // 悬浮效果配置
  const hoverEffects = hover 
    ? 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out' 
    : '';

  // 边框配置
  const borderClass = border 
    ? 'border border-slate-200 dark:border-slate-700' 
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        ${gradients[gradient]}
        ${hoverEffects}
        ${borderClass}
        ${padding}
        ${className}
        ${onClick ? 'cursor-pointer' : ''}
        bg-white dark:bg-slate-900
        shadow-sm
      `}
      {...props}
    >
      {/* 光泽效果 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/30 dark:from-white/5 to-transparent rounded-bl-full pointer-events-none" />
      
      {/* 内容 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

/**
 * 统计卡片组件
 */
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient = 'blue', 
  trend,
  trendUp,
  className = '',
  ...props 
}) => {
  return (
    <Card gradient={gradient} className={`flex flex-col ${className}`} {...props}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white/80 dark:bg-white/5 shadow-sm`}>
          <Icon size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trendUp 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {title}
      </div>
    </Card>
  );
};

/**
 * 操作卡片组件
 */
const ActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  gradient = 'none',
  accentColor = 'indigo',
  className = '',
  ...props 
}) => {
  const accentColors = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20',
  };

  return (
    <Card 
      gradient={gradient} 
      onClick={onClick}
      className={`flex flex-col items-center text-center ${className}`}
      {...props}
    >
      <div className={`p-4 rounded-2xl ${accentColors[accentColor]} mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </Card>
  );
};

export { Card, StatCard, ActionCard };
