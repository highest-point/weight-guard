import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CHART_COLORS } from '../../constants';
import { PieChart as PieChartIcon } from 'lucide-react';

export default function ModulePieChart({ tasks, isDarkMode }) {
  const moduleStats = {};
  tasks.forEach(task => {
    const moduleName = task.module || '其他';
    if (!moduleStats[moduleName]) moduleStats[moduleName] = 0;
    moduleStats[moduleName]++;
  });

  const chartData = Object.keys(moduleStats).map((key, index) => ({
    name: key,
    value: moduleStats[key],
    percentage: ((moduleStats[key] / tasks.length) * 100).toFixed(1),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const totalTasks = tasks.length;

  if (chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
        <PieChartIcon size={48} className="mb-2 opacity-20" />
        <p className="text-sm">暂无任务数据</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">创建任务后将在此显示模块分布</p>
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
            innerRadius={60}
            outerRadius={90}
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
