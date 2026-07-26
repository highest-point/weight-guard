import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Calendar } from 'lucide-react';

export default function TaskHeatmapChart({ tasks, isDarkMode }) {
  // 初始化热力图数据：7天 x 24小时
  const heatmapData = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      heatmapData.push([day, hour, 0]);
    }
  }

  // 填充实际数据
  tasks.forEach(task => {
    const date = new Date(task.date);
    const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六
    
    // 解析开始和结束时间
    const [startHour] = task.start.split(':').map(Number);
    const [endHour] = task.end.split(':').map(Number);
    
    // 统计每个小时的任务数量
    for (let hour = startHour; hour < endHour; hour++) {
      const index = dayOfWeek * 24 + hour;
      heatmapData[index][2] += 1;
    }
  });

  const maxCount = Math.max(...heatmapData.map(d => d[2]), 1);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
      textStyle: {
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      },
      formatter: function(params) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return `${days[params.value[0]]} ${params.value[1]}:00 - ${params.value[1] + 1}:00<br/>任务数: <strong>${params.value[2]}</strong>`;
      }
    },
    grid: {
      top: 30,
      right: 30,
      bottom: 40,
      left: 60,
    },
    xAxis: {
      type: 'category',
      data: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      splitArea: {
        show: true
      },
      axisLine: {
        lineStyle: {
          color: isDarkMode ? '#475569' : '#cbd5e1'
        }
      },
      axisLabel: {
        color: isDarkMode ? '#94a3b8' : '#64748b',
        fontSize: 11,
      }
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      splitArea: {
        show: true
      },
      axisLine: {
        lineStyle: {
          color: isDarkMode ? '#475569' : '#cbd5e1'
        }
      },
      axisLabel: {
        color: isDarkMode ? '#94a3b8' : '#64748b',
        fontSize: 10,
        interval: 2,
      }
    },
    visualMap: {
      min: 0,
      max: maxCount,
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      textStyle: {
        color: isDarkMode ? '#94a3b8' : '#64748b',
        fontSize: 11,
      },
      inRange: {
        color: [
          isDarkMode ? '#1e293b' : '#f8fafc',
          '#3b82f6',
          '#8b5cf6',
          '#ec4899',
        ]
      },
      text: ['高', '低'],
    },
    series: [
      {
        name: '任务热力图',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderRadius: 4,
          borderColor: isDarkMode ? '#1e293b' : '#ffffff',
          borderWidth: 2,
        }
      }
    ]
  };

  const totalHoursWithTasks = heatmapData.filter(d => d[2] > 0).length;
  const peakHour = heatmapData.reduce((max, d, i) => d[2] > heatmapData[max][2] ? i : max, 0);
  const peakDay = Math.floor(peakHour / 24);
  const peakHourNum = peakHour % 24;
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  if (heatmapData.every(d => d[2] === 0)) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
        <Calendar size={48} className="mb-2 opacity-20" />
        <p className="text-sm">暂无任务数据</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">创建任务后将在此显示时间分布</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
      
      <div className={`mt-3 flex items-center justify-end gap-4 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <span>活跃时段: {totalHoursWithTasks} 小时</span>
        <span>高峰: {days[peakDay]} {peakHourNum}:00</span>
      </div>
    </div>
  );
}
