import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layout, CheckCircle2, FileText, Calendar, Clock,
  BarChart2, PieChart, TrendingUp, Filter, BookOpen, Briefcase, Coffee, Dumbbell, Activity,
  ArrowRight, ChevronDown, ChevronLeft, ChevronRight, X, Sparkles, Loader2, Save, FileClock, CalendarRange,
  Target, Flame, Droplets, Footprints
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, APP_ID } from '../config/firebase';
import { VOLCENGINE_API_KEY, VOLCENGINE_ENDPOINT, EVENT_COLORS, CHART_COLORS } from '../constants';
import { getTodayStr, getTimeGreeting, calculateDuration, getLastWeekParams, getLastMonthParams, getLastYearParams } from '../utils';
import { LimitSelector } from '../components/LimitSelector';
import { PaginationControls } from '../components/PaginationControls';
import { Card, StatCard } from '../components/Card';
import { StatCardSkeleton } from '../components/Skeleton';
import WeightTrendChart from '../components/charts/WeightTrendChart';
import TaskCompletionTrendChart from '../components/charts/TaskCompletionTrendChart';
import ModulePieChart from '../components/charts/ModulePieChart';
import TaskStatusPieChart from '../components/charts/TaskStatusPieChart';
import TaskHeatmapChart from '../components/charts/TaskHeatmapChart';

export default function DashboardModule({ user, onNavigate, isDarkMode }) {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [weights, setWeights] = useState([]);
  const [aiReports, setAiReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);

  const [timeScope, setTimeScope] = useState('day');

  const [taskPage, setTaskPage] = useState(1);
  const [taskLimit, setTaskLimit] = useState(5);

  const [eventPage, setEventPage] = useState(1);
  const [eventLimit, setEventLimit] = useState(5);

  const [notePage, setNotePage] = useState(1);
  const [noteLimit, setNoteLimit] = useState(5);

  const [isReportCenterOpen, setIsReportCenterOpen] = useState(false);
  const [reportTab, setReportTab] = useState('week');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const autoGenRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    let dataLoadedCount = 0;
    const checkReady = () => { dataLoadedCount++; if (dataLoadedCount === 5) setIsDataReady(true); };

    const taskUnsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tasks'), (snap) => { if (snap.exists()) setTasks(snap.data().list || []); checkReady(); });
    const eventUnsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'calendar_events'), (snap) => { if (snap.exists()) setEvents(snap.data().list || []); checkReady(); });
    const noteUnsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), (snap) => { if (snap.exists()) setNotes(snap.data().list || []); checkReady(); });
    const weightUnsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'weights'), (snap) => { if (snap.exists()) setWeights(snap.data().list || []); checkReady(); });
    const reportUnsub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'ai_reports'), (snap) => {
      if (snap.exists()) setAiReports(snap.data().list || []); else setAiReports([]);
      checkReady(); setLoading(false);
    });
    return () => { taskUnsub(); eventUnsub(); noteUnsub(); weightUnsub(); reportUnsub(); };
  }, [user]);

  useEffect(() => setTaskPage(1), [taskLimit]);
  useEffect(() => setEventPage(1), [eventLimit]);
  useEffect(() => setNotePage(1), [noteLimit]);

  useEffect(() => {
    if (!isDataReady || autoGenRef.current) return;
    const checkAndGenerateMissingReports = async () => {
      autoGenRef.current = true;
      const requiredParams = [getLastWeekParams(), getLastMonthParams(), getLastYearParams()];
      let hasNewReport = false;
      const updatedReports = [...aiReports];

      for (const params of requiredParams) {
        if (updatedReports.find(r => r.id === params.id)) continue;
        setIsAutoGenerating(true);
        const periodTasks = tasks.filter(t => { const d = new Date(t.date); d.setHours(0, 0, 0, 0); return d >= params.start && d <= params.end; });
        const periodWeights = weights.filter(w => { const d = new Date(w.date); d.setHours(0, 0, 0, 0); return d >= params.start && d <= params.end; }).sort((a, b) => a.date.localeCompare(b.date));

        if (periodTasks.length === 0) {
          updatedReports.push({ id: params.id, type: params.type, title: params.title, desc: params.desc, content: `【系统提示】\n在这段时间内（${params.desc}），系统没有检测到您的任何任务记录。\n\n也许您给自己放了个长假？期待您未来的规划与成长！`, createdAt: new Date().toISOString() });
          hasNewReport = true; continue;
        }

        const totalCount = periodTasks.length;
        const completedCount = periodTasks.filter(t => t.status === 'completed').length;
        const completionRate = Math.round((completedCount / totalCount) * 100);
        const reflections = periodTasks.filter(t => t.reflection && t.reflection.trim() !== '').map(t => `【${t.date} | ${t.content}】: ${t.reflection}`).join('\n');

        let weightContext = '无体重记录。';
        if (periodWeights.length > 0) {
          const firstW = periodWeights[0]; const lastW = periodWeights[periodWeights.length - 1];
          const diff = (lastW.weight - firstW.weight).toFixed(1);
          const trend = diff > 0 ? `上涨了 ${diff}kg` : (diff < 0 ? `下降了 ${Math.abs(diff)}kg` : '保持平稳');
          weightContext = `期初(${firstW.date})体重: ${firstW.weight}kg, 期末(${lastW.date})体重: ${lastW.weight}kg。整体趋势：${trend}。`;
        }

        const scopeName = params.type === 'week' ? '本周' : (params.type === 'month' ? '本月' : '本年度');
        const prompt = `你是一位专业的个人成长与健康管理教练。请根据我提供的${scopeName}客观数据，为我写一份有深度、有温度的「${scopeName}度个人成长总结报告」。\n\n【我的客观数据】\n- 任务完成率：计划总数 ${totalCount} 项，实际完成 ${completedCount} 项，完成率 ${completionRate}%。\n- 体重变化趋势：${weightContext}\n- 我的日常反思与总结摘要：\n${reflections || '无详细反思'}\n\n【报告要求】\n1. 核心洞察：从任务执行和体重变化中，发现我的行为模式和努力的亮点。\n2. 改进建议：结合我遇到的困难（在反思中）和完成率/体重数据，给出切实可行的下阶段行动建议。\n3. 语气：客观专业，充满鼓励和力量。\n4. 排版格式：请使用纯文本格式，段落清晰。⚠️绝对不要使用任何 Markdown 语法符号（如 **加粗** 或 # 标题等）。`;

        try {
          const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${VOLCENGINE_API_KEY}` }, body: JSON.stringify({ model: VOLCENGINE_ENDPOINT, messages: [{ role: 'system', content: '你是一位顶级的个人成长教练，擅长数据分析与心理激励。' }, { role: 'user', content: prompt }] }) });
          const data = await response.json();
          if (data.choices && data.choices.length > 0) {
            let aiText = data.choices[0].message.content; aiText = aiText.replace(/\*\*/g, '').replace(/### /g, '').replace(/## /g, '').replace(/# /g, '');
            updatedReports.push({ id: params.id, type: params.type, title: params.title, desc: params.desc, content: aiText, createdAt: new Date().toISOString() });
            hasNewReport = true;
          }
        } catch (error) { console.error('AI 后台自动生成报告失败:', error); }
      }

      if (hasNewReport) await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'ai_reports'), { list: updatedReports }, { merge: true });
      setIsAutoGenerating(false);
    };

    checkAndGenerateMissingReports();
  }, [isDataReady, tasks, weights, aiReports, user.uid]);

  const todayStr = getTodayStr();

  const todayTasksAll = tasks.filter(t => t.date === todayStr).sort((a, b) => a.start.localeCompare(b.start));
  const todayCompletedCount = todayTasksAll.filter(t => t.status === 'completed').length;
  const totalTaskPages = Math.ceil(todayTasksAll.length / taskLimit) || 1;
  const displayedTasks = todayTasksAll.slice((taskPage - 1) * taskLimit, taskPage * taskLimit);

  const sortedEventsAll = [...events].sort((a, b) => {
    const aActive = todayStr >= a.startDate && todayStr <= a.endDate;
    const bActive = todayStr >= b.startDate && todayStr <= b.endDate;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    if (a.endDate !== b.endDate) return a.endDate.localeCompare(b.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
  const totalEventPages = Math.ceil(sortedEventsAll.length / eventLimit) || 1;
  const displayedEvents = sortedEventsAll.slice((eventPage - 1) * eventLimit, eventPage * eventLimit);

  const sortedNotesAll = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalNotePages = Math.ceil(sortedNotesAll.length / noteLimit) || 1;
  const displayedNotes = sortedNotesAll.slice((notePage - 1) * noteLimit, notePage * noteLimit);

  const statsData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMon = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const startOfWeek = new Date(now); startOfWeek.setDate(diffToMon); startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const filteredTasks = tasks.filter(task => {
      if (timeScope === 'all') return true;
      if (timeScope === 'day') return task.date === todayStr;
      const taskDate = new Date(task.date); taskDate.setHours(0, 0, 0, 0);
      if (timeScope === 'week') return taskDate >= startOfWeek && taskDate <= endOfWeek;
      if (timeScope === 'month') return taskDate >= startOfMonth && taskDate <= endOfMonth;
      if (timeScope === 'year') return taskDate >= startOfYear && taskDate <= endOfYear;
      return false;
    });

    const totalCount = filteredTasks.length;
    const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const moduleStats = {};
    filteredTasks.forEach(task => {
      const duration = calculateDuration(task.start, task.end);
      const moduleName = task.module || '其他';
      if (!moduleStats[moduleName]) moduleStats[moduleName] = 0;
      moduleStats[moduleName] += duration;
    });

    const chartData = Object.keys(moduleStats).map(key => ({ name: key, value: parseFloat((moduleStats[key] / 60).toFixed(1)), rawMinutes: moduleStats[key] }));
    return { totalCount, completedCount, completionRate, chartData };
  }, [tasks, timeScope, todayStr]);

  const displayReports = aiReports.filter(r => r.type === reportTab).sort((a, b) => b.id.localeCompare(a.id));
  const activeReport = aiReports.find(r => r.id === selectedReportId) || displayReports[0];
  const greeting = getTimeGreeting();

  if (loading) return <div className="h-full flex items-center justify-center"><div className="animate-spin text-indigo-500"><Layout /></div></div>;

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in pb-10">
      {isReportCenterOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-indigo-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm"><Sparkles size={20} /></div>
                <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg">AI 个人成长报告中心</h3>
                {isAutoGenerating && (
                  <span className="text-xs text-indigo-500 dark:text-indigo-400 bg-white/50 dark:bg-slate-800 px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 ml-2 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> 正在后台生成缺失的历史报告...
                  </span>
                )}
              </div>
              <button onClick={() => setIsReportCenterOpen(false)} className="text-indigo-400 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-64 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col h-full shrink-0">
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  {[{ id: 'week', label: '周报' }, { id: 'month', label: '月报' }, { id: 'year', label: '年报' }].map(tab => (
                    <button
                      key={tab.id} onClick={() => { setReportTab(tab.id); setSelectedReportId(null); }}
                      className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${reportTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-slate-800' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                  {displayReports.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-10 mt-10">暂无{reportTab === 'week' ? '周报' : (reportTab === 'month' ? '月报' : '年报')}数据</div>
                  ) : (
                    displayReports.map(r => (
                      <button
                        key={r.id} onClick={() => setSelectedReportId(r.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          (selectedReportId === r.id || (!selectedReportId && activeReport?.id === r.id))
                            ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-500/50 shadow-sm ring-1 ring-indigo-100 dark:ring-0'
                            : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-1 truncate">{r.title}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{r.desc}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto p-8 custom-scrollbar">
                {activeReport ? (
                  <div className="max-w-2xl mx-auto animate-in fade-in">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">{activeReport.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <Calendar size={14} /> 周期：{activeReport.desc}
                      <span className="ml-2 text-indigo-400 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded font-mono border border-indigo-100 dark:border-indigo-800/50">
                        生成时间: {new Date(activeReport.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 text-sm leading-loose whitespace-pre-wrap">
                      {activeReport.content}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                    <FileClock size={64} className="mb-4 opacity-20" />
                    <p>请在左侧选择一份报告进行阅读</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 rounded-2xl p-8 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">{greeting}, {user.displayName || 'User'}!</h1>
            <p className="opacity-90">今天是 {todayStr}。你今天还有 <span className="font-bold text-yellow-300 dark:text-yellow-400 text-lg">{todayTasksAll.length - todayCompletedCount}</span> 项计划待完成，继续加油！</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="今日计划" 
            value={todayTasksAll.length} 
            icon={Calendar}
            gradient="blue"
            onClick={() => onNavigate('tasks')}
          />
          <StatCard 
            title="已完成" 
            value={todayCompletedCount} 
            icon={CheckCircle2}
            gradient="green"
          />
          <StatCard 
            title="待完成" 
            value={todayTasksAll.length - todayCompletedCount} 
            icon={Target}
            gradient="orange"
          />
          <StatCard 
            title="活跃笔记" 
            value={notes.length} 
            icon={FileText}
            gradient="purple"
            onClick={() => onNavigate('notes')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="flex flex-col h-[420px]" gradient="blue">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="flex items-center gap-3"><h3 className="font-bold text-slate-800 dark:text-slate-100">今日概览</h3><LimitSelector value={taskLimit} onChange={setTaskLimit} /></div>
              <button onClick={() => onNavigate('tasks')} className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">查看全部 <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {todayTasksAll.length === 0 ? <div className="text-slate-300 dark:text-slate-500 text-sm text-center py-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">今日暂无安排</div> :
                displayedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-3 bg-white/80 dark:bg-slate-800/50 rounded-xl border border-slate-50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-green-400 dark:bg-green-500' : 'bg-indigo-500 dark:bg-indigo-400'}`}></div>
                    <div className="font-mono text-xs text-slate-500 dark:text-slate-400 shrink-0 w-20">{task.start} - {task.end}</div>
                    <div className={`flex-1 text-sm font-bold truncate ${task.status === 'completed' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{task.content}</div>
                    <div className="text-[10px] px-2 py-1 bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600 rounded text-slate-500 dark:text-slate-400 shrink-0">{task.module}</div>
                  </div>
                ))}
            </div>
            <PaginationControls currentPage={taskPage} totalPages={totalTaskPages} totalCount={todayTasksAll.length} unitName="计划" onPrev={() => setTaskPage(p => Math.max(1, p - 1))} onNext={() => setTaskPage(p => Math.min(totalTaskPages, p + 1))} />
          </Card>

          <Card className="flex flex-col h-[420px]" gradient="purple">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="flex items-center gap-3"><h3 className="font-bold text-slate-800 dark:text-slate-100">跨日计划</h3><LimitSelector value={eventLimit} onChange={setEventLimit} /></div>
              <button onClick={() => onNavigate('tasks')} className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">进入排期 <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {sortedEventsAll.length === 0 ? <div className="text-slate-300 dark:text-slate-500 text-sm text-center py-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">暂无跨日计划</div> :
                displayedEvents.map(ev => {
                  const isActive = todayStr >= ev.startDate && todayStr <= ev.endDate;
                  const colorObj = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[0];
                  return (
                    <div key={ev.id} className={`p-4 rounded-xl border transition-colors cursor-pointer group ${isActive ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/40' : 'bg-white/80 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'}`} onClick={() => onNavigate('tasks')}>
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${colorObj.dot.replace('bg-', 'bg-')}`}></div>
                          <h4 className={`font-bold text-sm truncate ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{ev.title}</h4>
                        </div>
                        {isActive && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded font-bold shrink-0 ml-2">进行中</span>}
                      </div>
                      {ev.description && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2 pl-4">{ev.description}</p>}
                      <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pl-4">
                        <CalendarRange size={12} /> {ev.startDate} ~ {ev.endDate}
                      </div>
                    </div>
                  )
                })}
            </div>
            <PaginationControls currentPage={eventPage} totalPages={totalEventPages} totalCount={sortedEventsAll.length} unitName="项目" onPrev={() => setEventPage(p => Math.max(1, p - 1))} onNext={() => setEventPage(p => Math.min(totalEventPages, p + 1))} />
          </Card>

          <Card className="flex flex-col h-[420px]" gradient="orange">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="flex items-center gap-3"><h3 className="font-bold text-slate-800 dark:text-slate-100">最新笔记</h3><LimitSelector value={noteLimit} onChange={setNoteLimit} /></div>
              <button onClick={() => onNavigate('notes')} className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline flex items-center gap-1">查看全部 <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
              {sortedNotesAll.length === 0 ? <div className="text-slate-300 dark:text-slate-500 text-sm text-center py-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">暂无笔记</div> :
                displayedNotes.map(note => (
                  <div key={note.id} className="p-4 bg-white/80 dark:bg-slate-800/50 border border-orange-100/50 dark:border-orange-900/20 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => onNavigate('notes')}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate pr-2">{note.title}</h4>
                      {note.priority === 'high' && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded font-bold shrink-0">高</span>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{note.content}</p>
                    <div className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 flex justify-between"><span>{new Date(note.createdAt).toLocaleDateString()}</span>{note.attachment && <span className="text-indigo-400 dark:text-indigo-500">📎 有附件</span>}</div>
                  </div>
                ))}
            </div>
            <PaginationControls currentPage={notePage} totalPages={totalNotePages} totalCount={sortedNotesAll.length} unitName="笔记" onPrev={() => setNotePage(p => Math.max(1, p - 1))} onNext={() => setNotePage(p => Math.min(totalNotePages, p + 1))} />
          </Card>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BarChart2 className="text-indigo-600 dark:text-indigo-400" /> 数据统计</h2>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsReportCenterOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <FileClock size={16} /> 打开 AI 报告中心
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md border border-white/30 ml-1">{aiReports.length}</span>
            </button>

            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 inline-flex">
              {[{ id: 'day', label: '今天' }, { id: 'week', label: '本周' }, { id: 'month', label: '本月' }, { id: 'year', label: '今年' }, { id: 'all', label: '全部' }].map(tab => (
                <button key={tab.id} onClick={() => setTimeScope(tab.id)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeScope === tab.id ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard 
            title="计划总计" 
            value={`${statsData.totalCount} 项`} 
            icon={Calendar}
            gradient="blue"
          />
          <StatCard 
            title="完成总计" 
            value={`${statsData.completedCount} 项`} 
            icon={CheckCircle2}
            gradient="green"
          />
          <StatCard 
            title="整体完成率" 
            value={`${statsData.completionRate}%`} 
            icon={TrendingUp}
            gradient="indigo"
          />
        </div>

        {/* 新增图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Activity className="text-indigo-500" size={18} /> 体重趋势
            </h3>
            <div className="flex-1 h-64">
              <WeightTrendChart weights={weights} isDarkMode={isDarkMode} />
            </div>
          </Card>

          <Card className="flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Target className="text-green-500" size={18} /> 任务完成率趋势
            </h3>
            <div className="flex-1 h-64">
              <TaskCompletionTrendChart tasks={tasks} isDarkMode={isDarkMode} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <PieChart className="text-purple-500" size={18} /> 模块占比
            </h3>
            <div className="flex-1 h-64">
              <ModulePieChart tasks={tasks} isDarkMode={isDarkMode} />
            </div>
          </Card>

          <Card className="flex flex-col">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Briefcase className="text-amber-500" size={18} /> 任务状态分布
            </h3>
            <div className="flex-1 h-64">
              <TaskStatusPieChart tasks={tasks} isDarkMode={isDarkMode} />
            </div>
          </Card>
        </div>

        {/* 热力图 */}
        <Card className="flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Calendar className="text-rose-500" size={18} /> 任务时间分布热力图
          </h3>
          <div className="flex-1 h-80">
            <TaskHeatmapChart tasks={tasks} isDarkMode={isDarkMode} />
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">模块时间分配 (小时)</h3>
          <div className="h-64 w-full">
            {statsData.chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                <BarChart2 size={48} className="mb-2 opacity-20" />
                <p>该时间段内暂无数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData.chartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                    contentStyle={{
                      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statsData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}