import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Circle } from 'lucide-react';

const STATUS_COLORS = {
  completed: '#22c55e',
  active: '#6366f1',
  draft: '#f59e0b',
  archived: '#64748b',
};

const STATUS_LABELS = {
  completed: '已完成',
  active: '进行中',
  draft: '草稿',
  archived: '已归档',
};

export default function TaskStatusPieChart({ tasks, isDarkMode }) {
  const statusStats = {};
  tasks.forEach(task => {
    const status = task.status || 'active';
    if (!statusStats[status]) statusStats[status] = 0;
    statusStats[status]++;
  });

  const chartData = Object.keys(statusStats).map(key => ({
    name: STATUS_LABELS[key] || key,
    value: statusStats[key],
    percentage: ((statusStats[key] / tasks.length) * 100).toFixed(1),
    color: STATUS_COLORS[key] || '#94a3b8',
    status: key,
  }));

  const totalTasks = tasks.length;

  if (chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
        <Circle size={48} className="mb-2 opacity-20" />
        <p className="text-sm">暂无任务数据</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">创建任务后将在此显示状态分布</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            labelLine={{ stroke: isDarkMode ? '#475569' : '#cbd5e1', strokeWidth: 1 }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              borderColor: isDarkMode ? '#334155' : '#e2e8f0',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value, name, props) => {
              return [
                `${value} 项 (${props.payload.percentage}%)`,
                props.payload.name
              ];
            }}
          />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            iconSize={10}
            textStyle={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <div className={`mt-3 flex items-center justify-end gap-2 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <span>总计: {totalTasks} 项任务</span>
      </div>
    </div>
  );
}
