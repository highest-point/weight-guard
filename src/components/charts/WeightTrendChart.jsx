import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function WeightTrendChart({ weights, isDarkMode, goalWeight = 0 }) {
  const sortedWeights = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const chartData = sortedWeights.map(w => ({
    date: w.date,
    weight: w.weight,
    bmi: w.bmi || (w.weight / (1.75 * 1.75)).toFixed(1),
  }));

  const weightChange = chartData.length >= 2 
    ? (chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1)
    : 0;

  if (chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
        <TrendingUp size={48} className="mb-2 opacity-20" />
        <p className="text-sm">暂无体重数据</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">记录体重后将在此显示趋势</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDarkMode ? '#6366f1' : '#818cf8'} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isDarkMode ? '#6366f1' : '#818cf8'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#94a3b8' }} 
            axisLine={false} 
            tickLine={false}
            minTickGap={20}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#94a3b8' }} 
            axisLine={false} 
            tickLine={false}
            label={{ value: '体重 (kg)', position: 'insideLeft', fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#94a3b8' }}
          />
          {goalWeight > 0 && (
            <ReferenceLine 
              y={goalWeight} 
              stroke="#f59e0b" 
              strokeDasharray="5 5" 
              label={{ value: `目标: ${goalWeight}kg`, position: 'top', fontSize: 10, fill: '#f59e0b' }}
            />
          )}
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
              return [
                `${value} kg`,
                `${props.payload.date}`
              ];
            }}
          />
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke={isDarkMode ? '#6366f1' : '#818cf8'} 
            strokeWidth={2}
            dot={{ r: 4, fill: isDarkMode ? '#6366f1' : '#818cf8', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 2 }}
            name="体重"
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className={`mt-3 flex items-center justify-end gap-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <span className="flex items-center gap-1">
          {weightChange > 0 ? <TrendingDown size={14} className="text-red-400" /> : <TrendingUp size={14} className="text-green-400" />}
          {weightChange > 0 ? '+' : ''}{weightChange} kg
        </span>
        {goalWeight > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            目标: {goalWeight}kg
          </span>
        )}
      </div>
    </div>
  );
}
