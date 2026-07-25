/**
 * 空状态组件
 * 各模块空状态的友好引导和操作建议
 */

import { Clock, FileText, Scale, Target, Plus, ArrowRight } from 'lucide-react';

const EmptyState = ({ 
  type = 'default', 
  title, 
  description, 
  actionText, 
  onAction,
  icon: CustomIcon,
  className = '' 
}) => {
  // 预设空状态配置
  const presetConfigs = {
    tasks: {
      icon: Clock,
      title: '暂无任务',
      description: '开始创建您的第一个任务，规划每一天的目标',
      actionText: '创建任务',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-500',
    },
    notes: {
      icon: FileText,
      title: '暂无笔记',
      description: '记录您的想法、心得和重要信息',
      actionText: '新建笔记',
      gradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      iconBg: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-500',
    },
    weight: {
      icon: Scale,
      title: '暂无体重记录',
      description: '记录您的体重变化，追踪健康目标',
      actionText: '记录体重',
      gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-500',
    },
    dashboard: {
      icon: Target,
      title: '开始您的健康之旅',
      description: '创建任务、记录体重、写下笔记，开始管理您的健康',
      actionText: '开始体验',
      gradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-500',
    },
    default: {
      icon: Target,
      title: '暂无数据',
      description: '开始添加数据，开启您的旅程',
      actionText: '添加数据',
      gradient: 'from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-500',
    },
  };

  const config = presetConfigs[type] || presetConfigs.default;
  const Icon = CustomIcon || config.icon;

  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 ${className}`}>
      <div className={`w-full max-w-md text-center bg-gradient-to-br ${config.gradient} rounded-3xl p-8 md:p-12`}>
        {/* 图标 */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${config.iconBg} flex items-center justify-center shadow-lg`}>
          <Icon size={40} className={config.iconColor} />
        </div>

        {/* 标题 */}
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
          {title || config.title}
        </h3>

        {/* 描述 */}
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {description || config.description}
        </p>

        {/* 操作按钮 */}
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-500/25 group"
          >
            <Plus size={18} />
            {actionText || config.actionText}
            <ArrowRight size={16} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
          </button>
        )}

        {/* 提示信息 */}
        <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            💡 提示：坚持每天记录，见证您的进步
          </p>
        </div>
      </div>
    </div>
  );
};

export { EmptyState };
