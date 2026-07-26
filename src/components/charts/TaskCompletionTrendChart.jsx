import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Target, TrendingUp } from 'lucide-react';

export default function TaskCompletionTrendChart({ tasks, isDarkMode }) {
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last30Days.push(dateStr);
  }

  const chartData = last30Days.map(date => {
    const dayTasks = tasks.filter(t => t.date === date);
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      date: date.slice(5),
      total,
      completed,
      rate,
      rawDate: date,
    };
  });

  const avgRate = chartData.reduce((sum, d) => sum + d.rate, 0) / chartData.length;
  const maxRate = Math.max(...chartData.map(d => d.rate));

  if (chartData.every(d => d.total === 0)) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
        <Target size={48} className="mb-2 opacity-20" />
        <p className="text-sm">暂无任务数据</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">创建任务后将在此显示完成趋势</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDarkMode ? '#22c55e' : '#4ade80'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isDarkMode ? '#22c55e' : '#4ade80'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#94a3b8' }} 
            axisLine={false} 
            tickLine={false}
            minTickGap={15}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#94a3b8' }} 
            axisLine={false} 
            tickLine={false}
            domain={[0, 100]}
            label={{ value: '完成率 (%)', position: 'insideLeft', fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#94a3b8' }}
          />
          <Tooltip
            cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
            contentStyle={{
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              borderColor: isDarkMode ? '#334155' : '#e2e8f0',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value, name, props) => {
              if (name === 'rate') {
                return [`${value}%`, `完成率`];
              }
              return [`${value} 项`, name === 'completed' ? '已完成' : '总计'];
            }}
          />
          <Area 
            type="monotone" 
            dataKey="rate" 
            stroke={isDarkMode ? '#22c55e' : '#4ade80'} 
            fill="url(#completionGradient)"
            strokeWidth={2}
            name="完成率"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className={`mt-3 flex items-center justify-end gap-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <span className="flex items-center gap-1">
          <TrendingUp size={14} className="text-green-400" />
          平均: {avgRate.toFixed(0)}%
        </span>
        <span>最高: {maxRate}%</span>
      </div>
    </div>
  );
}
