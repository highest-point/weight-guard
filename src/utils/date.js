// Date utilities
export const getTodayStr = () => new Date().toISOString().split('T')[0];

export const getLocalTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayDate = getLocalTodayDate;

export const getMondayDate = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export const getFutureDate = (weeks) => {
  const d = new Date();
  d.setDate(d.getDate() + (weeks * 7));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMinDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T00:00`;
};

export const getISOWeekInfo = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
};

export const getLastWeekParams = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dayOfWeek = now.getDay() || 7;
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek);
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);
  const { year, week } = getISOWeekInfo(lastMonday);
  const fDate = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  return { id: `week_${year}_${week}`, type: 'week', title: `${year}年 第${week}周 成长报告`, desc: `${fDate(lastMonday)} - ${fDate(lastSunday)}`, start: lastMonday, end: new Date(lastSunday.setHours(23, 59, 59, 999)) };
};

export const getLastMonthParams = () => {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { id: `month_${year}_${month}`, type: 'month', title: `${year}年 ${month}月 成长报告`, desc: '整月数据分析', start, end };
};

export const getLastYearParams = () => {
  const now = new Date();
  const year = now.getFullYear() - 1;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { id: `year_${year}`, type: 'year', title: `${year}年度 成长报告`, desc: '全年数据总结', start, end };
};

export const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return '早安';
  if (hour >= 12 && hour < 14) return '中午好';
  if (hour >= 14 && hour < 19) return '下午好';
  if (hour >= 19 && hour < 23) return '晚上好';
  return '夜深了';
};

export const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return (endH * 60 + endM) - (startH * 60 + startM);
};

export const getUrgency = (deadlineStr) => {
  if (!deadlineStr) return { color: 'bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500', text: '无截止日期' };

  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { color: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500', text: '已逾期' };
  if (diffDays <= 3) return { color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', text: `剩余 ${diffDays} 天 (紧急)` };
  if (diffDays <= 7) return { color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', text: `剩余 ${diffDays} 天 (提醒)` };
  return { color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400', text: `剩余 ${diffDays} 天` };
};

export const getPlanStatus = (startDate, endDate) => {
  const today = new Date(getTodayDate());
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (today < start) {
    return { text: '未开始', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' };
  } else if (today > end) {
    return { text: '已结束', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
  } else {
    return { text: '进行中', color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' };
  }
};