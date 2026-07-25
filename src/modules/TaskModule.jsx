import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Calendar, Loader2, X, 
  Clock, Tag, AlignLeft, Layers, Paperclip, Image as ImageIcon, ExternalLink,
  Search, CheckCircle2, Circle, ArrowUpDown, Copy, LayoutTemplate,
  File as FileIcon, Eye, Download, FileText as PdfIcon, RotateCcw,
  MessageSquare, Quote, Sparkles, CalendarRange, List, Link as LinkIcon,
  GanttChartSquare, GanttChart, ChevronUp, ChevronDown, Wand2, FileSpreadsheet
} from 'lucide-react';
import { db, APP_ID } from '../config/firebase';
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import { VOLCENGINE_API_KEY, VOLCENGINE_ENDPOINT, EVENT_COLORS, PRIORITY_MAP } from '../constants';
import { uploadToCloudinary, calculateDuration } from '../utils';
import { AttachmentItem, ModuleManager, CalendarEventModal } from '../components';

export default function TaskModule({ user }) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [taskSummaries, setTaskSummaries] = useState({}); 
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const isGeneratingRef = useRef(false); 
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true); 
  const [isSummaryLoaded, setIsSummaryLoaded] = useState(false);
  
  const [isAIBreakdownModalOpen, setIsAIBreakdownModalOpen] = useState(false);
  const [isAIBreakdownLoading, setIsAIBreakdownLoading] = useState(false);
  const [aiBreakdownEvent, setAiBreakdownEvent] = useState(null);
  const [aiBreakdownTasks, setAiBreakdownTasks] = useState([]);

  const [isAIDailyScheduleModalOpen, setIsAIDailyScheduleModalOpen] = useState(false);
  const [isAIDailyScheduleLoading, setIsAIDailyScheduleLoading] = useState(false);
  const [aiDailyScheduleTasks, setAiDailyScheduleTasks] = useState([]);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isParsingSchedule, setIsParsingSchedule] = useState(false);

  const [viewMode, setViewMode] = useState('list'); 
  const [searchTerm, setSearchTerm] = useState('');

  const [currentDate, setCurrentDate] = useState(todayStr);
  const [plans, setPlans] = useState([]);
  const [modules, setModules] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModuleMgrOpen, setIsModuleMgrOpen] = useState(false);
  const [templatePage, setTemplatePage] = useState(1);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sortBy, setSortBy] = useState('time');
  const [newAttachments, setNewAttachments] = useState([]);
  const [reflectingPlan, setReflectingPlan] = useState(null); 
  const [reflectionText, setReflectionText] = useState('');
  
  const [preSelectedEventId, setPreSelectedEventId] = useState(null);

  const [editingChecklist, setEditingChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [repeatRule, setRepeatRule] = useState('none');
  const [repeatEndDate, setRepeatEndDate] = useState('');

  useEffect(() => {
    if (isModalOpen) {
        if (editingPlan) {
            setEditingChecklist(editingPlan.checklist || []);
        } else {
            setEditingChecklist([]);
        }
        setNewChecklistItem('');
        setRepeatRule('none');
        setRepeatEndDate('');
    }
  }, [isModalOpen, editingPlan]);

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date()); 
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const relatedPlansForEvent = useMemo(() => {
      if (!editingEvent || !editingEvent.id) return [];
      return plans
          .filter(p => p.relatedEventId === editingEvent.id)
          .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }, [plans, editingEvent]);
  
  useEffect(() => {
    if (!user) return;
    const taskSub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tasks'), (snap) => {
      if (snap.exists()) {
        const list = snap.data().list || [];
        const normalizedList = list.map(plan => ({
          ...plan,
          attachments: plan.attachments || (plan.attachment ? [plan.attachment] : []),
          reflection: plan.reflection || null 
        }));
        setPlans(normalizedList);
      } else {
        setPlans([]);
      }
      setLoading(false);
    });

    const moduleSub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'task_modules'), (snap) => {
      if (snap.exists()) setModules(snap.data().list || []);
      else setModules([]);
    });

    const eventSub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'calendar_events'), (snap) => {
        if (snap.exists()) setCalendarEvents(snap.data().list || []);
        else setCalendarEvents([]);
    });

    const summarySub = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'task_summaries'), (snap) => {
        if (snap.exists()) {
            setTaskSummaries(snap.data().summaries || {});
        } else {
            setTaskSummaries({});
        }
        setIsSummaryLoaded(true); 
    });

    return () => { taskSub(); moduleSub(); eventSub(); summarySub(); };
  }, [user]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsSaving(true);
    const uploadedFiles = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { alert(`文件 ${file.name} 过大，跳过上传`); continue; }
      const result = await uploadToCloudinary(file);
      if (result) uploadedFiles.push(result);
    }
    setNewAttachments(prev => [...prev, ...uploadedFiles]);
    setIsSaving(false);
    e.target.value = ''; 
  };

  const handleRemoveAttachment = (attId, isNew = false) => {
    if (!window.confirm("确定移除此附件吗？")) return;
    if (isNew) {
      setNewAttachments(prev => prev.filter(a => a.id !== attId));
    } else {
      if (editingPlan) {
        setEditingPlan(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== attId) }));
      }
    }
  };

  const saveModulesToCloud = async (newModules) => {
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'task_modules'), { list: newModules }, { merge: true });
  };
  const handleSaveModule = (newModule) => {
    const exists = modules.find(m => m.id === newModule.id);
    const updated = exists ? modules.map(m => m.id === newModule.id ? newModule : m) : [...modules, newModule];
    saveModulesToCloud(updated);
  };
  const handleDeleteModule = (id) => {
    if(window.confirm("确定删除此模板吗？")) saveModulesToCloud(modules.filter(m => m.id !== id));
  };
  const applyTemplate = (template) => {
    setEditingPlan({ ...template, id: null, date: currentDate, status: 'pending', attachments: [] });
  };
  const saveToCloud = async (newPlans) => {
    if (!user) return;
    try { await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tasks'), { list: newPlans, updatedAt: new Date().toISOString() }, { merge: true }); } catch (e) { console.error(e); }
  };

  const visiblePlans = useMemo(() => {
    let filtered = searchTerm.trim() 
        ? plans.filter(p => p.content.includes(searchTerm) || p.module.includes(searchTerm) || p.sub?.includes(searchTerm))
        : plans.filter(p => p.date === currentDate);

    return filtered.sort((a, b) => {
      const isACompleted = a.status === 'completed';
      const isBCompleted = b.status === 'completed';
      if (isACompleted && !isBCompleted) return 1; 
      if (!isACompleted && isBCompleted) return -1;
      if (sortBy === 'tag') {
        const pA = PRIORITY_MAP[a.tag] || 4;
        const pB = PRIORITY_MAP[b.tag] || 4;
        if (pA !== pB) return pA - pB;
      }
      if (searchTerm.trim() && a.date !== b.date) return b.date.localeCompare(a.date);
      return a.start.localeCompare(b.start);
    });
  }, [plans, currentDate, searchTerm, sortBy]);

  const yesterdaySummaryData = useMemo(() => {
    if (currentDate !== todayStr) return null;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yYear = d.getFullYear();
    const yMonth = String(d.getMonth() + 1).padStart(2, '0');
    const yDay = String(d.getDate()).padStart(2, '0');
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    const allYesterdayTasks = plans.filter(p => p.date === yesterdayStr);
    if (allYesterdayTasks.length === 0) return null;

    const isAllCompleted = allYesterdayTasks.every(p => p.status === 'completed');
    if (!isAllCompleted) return null;

    const tasksWithReflection = allYesterdayTasks.filter(p => p.reflection && p.reflection.trim() !== '');
    const tasksToSummarize = tasksWithReflection.length > 0 ? tasksWithReflection : allYesterdayTasks;

    return { date: yesterdayStr, tasks: tasksToSummarize };
  }, [plans, currentDate, todayStr]);

  useEffect(() => {
    const autoGenerateSummary = async () => {
        if (!isSummaryLoaded) return; 

        if (!yesterdaySummaryData || yesterdaySummaryData.tasks.length === 0) return;
        const yDate = yesterdaySummaryData.date;
        
        if (taskSummaries[yDate] || isGeneratingRef.current) return;

        isGeneratingRef.current = true;
        setIsGeneratingSummary(true);
        
        const tasksContent = yesterdaySummaryData.tasks
            .map(t => `【任务】：${t.content}\n【我的反思】：${t.reflection || '无'}`)
            .join('\n\n');
            
        const prompt = `请作为一名专业的时间管理与个人成长教练，对我昨日的任务完成情况和个人反思进行详细总结。请明确告诉我：\n1. 哪里做得好，需要继续保持。\n2. 哪里存在不足，需要如何改进。\n3. 给我今天的一两条可行性建议。\n\n⚠️ 重点要求：请使用纯文本格式输出，绝对不要使用任何 Markdown 语法（如 **加粗**、# 标题等符号），段落之间直接用空行隔开即可。\n\n以下是我昨日的任务与反思记录：\n${tasksContent}`;

        try {
            const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${VOLCENGINE_API_KEY}`
                },
                body: JSON.stringify({
                    model: VOLCENGINE_ENDPOINT, 
                    messages: [
                        { role: 'system', content: '你是一位专业的个人成长教练，你的回答需要客观、有激励性并且排版清晰。' },
                        { role: 'user', content: prompt }
                    ]
                })
            });

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                let aiText = data.choices[0].message.content;
                aiText = aiText.replace(/\*\*/g, '').replace(/### /g, '').replace(/## /g, '').replace(/# /g, '');
                
                await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'task_summaries'), { 
                    summaries: { [yDate]: aiText } 
                }, { merge: true });
            }
        } catch (error) {
            console.error('AI 总结生成出错:', error);
        } finally {
            isGeneratingRef.current = false;
            setIsGeneratingSummary(false);
        }
    };

    autoGenerateSummary();
  }, [yesterdaySummaryData, taskSummaries, user, isSummaryLoaded]);

  const initiateCompletion = (plan) => {
    if (plan.status === 'completed') return;
    if (plan.date !== todayStr) { alert("只能确认今天的计划！\n历史计划不可更改，未来计划请当天再确认。"); return; }
    setReflectingPlan(plan);
    setReflectionText(''); 
  };
  const confirmReflection = async () => {
    if (!reflectingPlan) return;
    const updatedPlans = plans.map(p => p.id === reflectingPlan.id ? { ...p, status: 'completed', reflection: reflectionText.trim() } : p);
    setPlans(updatedPlans);
    await saveToCloud(updatedPlans);
    setReflectingPlan(null);
  };
  const skipReflection = async () => {
    if (!reflectingPlan) return;
    const updatedPlans = plans.map(p => p.id === reflectingPlan.id ? { ...p, status: 'completed', reflection: null } : p);
    setPlans(updatedPlans);
    await saveToCloud(updatedPlans);
    setReflectingPlan(null);
  };

  const deletePlan = async (id) => {
    if(!window.confirm("确定删除这条计划吗？")) return;
    const updatedPlans = plans.filter(p => p.id !== id);
    setPlans(updatedPlans);
    await saveToCloud(updatedPlans);
  };

  const handleDeleteTodayPlans = async () => {
    const dayPlans = plans.filter(p => p.date === currentDate);
    if (dayPlans.length === 0) {
        alert(`🎉 ${currentDate} 当天还没有任何计划哦！`);
        return;
    }
    if (window.confirm(`⚠️ 警告：确定要一键清空 ${currentDate} 的所有 ${dayPlans.length} 个计划吗？\n\n此操作不可恢复！`)) {
        setIsSaving(true);
        const updatedPlans = plans.filter(p => p.date !== currentDate);
        setPlans(updatedPlans);
        await saveToCloud(updatedPlans);
        setIsSaving(false);
    }
  };

  const toggleChecklistItem = async (planId, itemId) => {
    const updatedPlans = plans.map(p => {
        if (p.id === planId && p.checklist) {
            const updatedChecklist = p.checklist.map(c => 
                c.id === itemId ? { ...c, completed: !c.completed } : c
            );
            return { ...p, checklist: updatedChecklist };
        }
        return p;
    });
    setPlans(updatedPlans);
    await saveToCloud(updatedPlans);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const start = fd.get('start');
    const end = fd.get('end');
    const planDate = fd.get('planDate') || editingPlan?.date || currentDate;

    if (start >= end) { alert("时间设置不规范：\n结束时间必须晚于开始时间！"); return; }
    
    if (!editingPlan?.id && repeatRule !== 'none' && !repeatEndDate) {
        alert("请选择周期性任务的结束日期！");
        return;
    }

    const relatedEventId = fd.get('relatedEventId');
    const relatedEvent = calendarEvents.find(ev => ev.id === relatedEventId);

    setIsSaving(true);
    const finalAttachments = [ ...(editingPlan?.attachments || []), ...newAttachments ];
    
    const basePlan = {
      start: start,
      end: end,
      module: fd.get('module'),
      sub: fd.get('sub'),
      content: fd.get('content'),
      tag: fd.get('tag'),
      relatedEventId: relatedEventId || null, 
      relatedEventTitle: relatedEvent ? relatedEvent.title : null, 
      attachments: finalAttachments, 
      attachment: null, 
      status: editingPlan?.status || 'pending',
      reflection: editingPlan?.reflection || null, 
      checklist: editingChecklist 
    };

    let updatedPlans = [...plans];

    if (editingPlan && editingPlan.id) {
        const newPlan = { ...basePlan, id: editingPlan.id, date: planDate };
        updatedPlans = updatedPlans.map(p => p.id === newPlan.id ? newPlan : p);
    } else {
        if (repeatRule !== 'none' && repeatEndDate) {
            const dates = [];
            let curr = new Date(planDate);
            const endDateObj = new Date(repeatEndDate);
            
            while (curr <= endDateObj) {
                const dayOfWeek = curr.getDay();
                const year = curr.getFullYear();
                const month = String(curr.getMonth() + 1).padStart(2, '0');
                const day = String(curr.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                if (repeatRule === 'daily') {
                    dates.push(dateStr);
                } else if (repeatRule === 'workday') {
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) dates.push(dateStr);
                } else if (repeatRule === 'weekly') {
                    const startDayOfWeek = new Date(planDate).getDay();
                    if (dayOfWeek === startDayOfWeek) dates.push(dateStr);
                }
                curr.setDate(curr.getDate() + 1);
            }
            
            const newPlansToInsert = dates.map((date, index) => ({
                ...basePlan,
                id: Date.now().toString() + "_" + index,
                date: date,
            }));
            updatedPlans = [...updatedPlans, ...newPlansToInsert];
        } else {
            const newPlan = { ...basePlan, id: Date.now().toString(), date: planDate };
            updatedPlans.push(newPlan);
        }
    }

    setPlans(updatedPlans);
    setIsModalOpen(false);
    setNewAttachments([]);
    setEditingPlan(null);
    setPreSelectedEventId(null); 
    setRepeatRule('none');
    setRepeatEndDate('');
    await saveToCloud(updatedPlans);
    setIsSaving(false);
  };

  const handleSaveEvent = async (eventData) => {
      const newEvent = { ...eventData, id: eventData.id || Date.now().toString() };
      let updatedEvents;
      if (eventData.id) {
          updatedEvents = calendarEvents.map(e => e.id === newEvent.id ? newEvent : e);
      } else {
          updatedEvents = [...calendarEvents, newEvent];
      }
      setCalendarEvents(updatedEvents);
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'calendar_events'), { list: updatedEvents }, { merge: true });
      setIsEventModalOpen(false);
      setEditingEvent(null);
  };

  const handleDeleteEvent = async (id) => {
      if(!window.confirm("确定删除这个跨日任务吗？\n\n注意：与之关联且【未完成】的每日计划也将被一并删除！")) return;
      
      const updatedEvents = calendarEvents.filter(e => e.id !== id);
      setCalendarEvents(updatedEvents);
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'calendar_events'), { list: updatedEvents }, { merge: true });
      
      const updatedPlans = plans.filter(p => {
          if (p.relatedEventId === id) {
              return p.status === 'completed';
          }
          return true;
      });
      
      if (updatedPlans.length !== plans.length) {
          setPlans(updatedPlans);
          await saveToCloud(updatedPlans);
      }

      setIsEventModalOpen(false);
      setEditingEvent(null);
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
      const day = new Date(year, month, 1).getDay();
      return day === 0 ? 6 : day - 1; 
  };

  const handlePlanDaily = (event) => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
    setViewMode('list');
    if (event.startDate) {
      setCurrentDate(event.startDate);
    }
    setPreSelectedEventId(event.id);
    setEditingPlan(null); 
    setNewAttachments([]);
    setTemplatePage(1);
    setTimeout(() => {
      setIsModalOpen(true);
    }, 100);
  };

  const handleAIBreakdown = async (event) => {
    setIsEventModalOpen(false); 
    setAiBreakdownEvent(event);
    setIsAIBreakdownModalOpen(true);
    setIsAIBreakdownLoading(true);
    setAiBreakdownTasks([]);

    const days = Math.floor((new Date(event.endDate) - new Date(event.startDate)) / (1000 * 60 * 60 * 24)) + 1;

    const existingPlansInRange = plans.filter(p => p.date >= event.startDate && p.date <= event.endDate);
    const busySlotsByDate = {};
    
    existingPlansInRange.forEach(p => {
        if (!busySlotsByDate[p.date]) busySlotsByDate[p.date] = [];
        busySlotsByDate[p.date].push(`${p.start}-${p.end}(${p.content})`);
    });

    let busySlotsStr = "【已有安排的时间段（请务必避开这些时间）】：\n";
    if (Object.keys(busySlotsByDate).length === 0) {
        busySlotsStr += "该时间段内目前没有其他安排。\n";
    } else {
        for (const [date, slots] of Object.entries(busySlotsByDate)) {
            busySlotsStr += `- ${date}: ${slots.join(', ')}\n`;
        }
    }

    const prompt = `你是一位专业的项目管理与时间规划专家。我有一个跨日项目任务，请帮我拆解为每天的具体执行计划。
    项目名称：${event.title}
    项目描述：${event.description || '无'}
    开始日期：${event.startDate}
    结束日期：${event.endDate}
    总天数：${days}天

    ${busySlotsStr}

    请严格按照以下 JSON 数组格式输出，不要返回任何 Markdown 标记(如 \`\`\`json )，也不要包含任何说明文字：
    [
      {
        "date": "YYYY-MM-DD", 
        "content": "具体的子任务描述",
        "module": "工作", 
        "start": "09:00", 
        "end": "11:00",
        "checklist": [
           { "text": "子步骤1" },
           { "text": "子步骤2" }
        ] 
      }
    ]
    
    说明：
    1. date 必须在开始与结束日期之间，按时间顺序排列。
    2. module 必须严格从 "工作", "学习", "生活", "运动", "其他" 中选择一个。
    3. 时间请合理安排，单次子任务时长建议在 30分钟 到 3小时 之间。
    4. ⚠️ 核心要求：你安排的 start 和 end 时间绝对不能与上述【已有安排的时间段】产生任何重叠！
    5. ⚠️ 核心要求：如果某一天已有的安排太满，或者没有合适的连续时间段，请**直接跳过那一天**，不强制每天都必须有任务。
    6. ⚠️ 新增要求：如果某个每日计划比较复杂，请在 checklist 数组中生成对应的子任务拆解（有就有，没有可以给空数组 []，不强制每个都有）。`;

    try {
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VOLCENGINE_API_KEY}`
            },
            body: JSON.stringify({
                model: VOLCENGINE_ENDPOINT,
                messages: [
                    { role: 'system', content: '你是一个严格输出 JSON 格式的助手，并且擅长时间冲突管理。' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            let aiText = data.choices[0].message.content.trim();
            if (aiText.startsWith('```json')) {
                aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
            } else if (aiText.startsWith('```')) {
                aiText = aiText.replace(/```/g, '').trim();
            }
            
            const parsedTasks = JSON.parse(aiText);
            const tasksWithIds = parsedTasks.map((t, idx) => ({ 
                ...t, 
                id: Date.now() + idx.toString(),
                checklist: (t.checklist || []).map(c => ({
                    id: Date.now() + Math.random().toString(),
                    text: c.text,
                    completed: false
                }))
            }));
            setAiBreakdownTasks(tasksWithIds);
        } else {
             alert("AI 拆解失败，请重试");
             setIsAIBreakdownModalOpen(false);
        }
    } catch (error) {
        console.error('AI 拆解失败:', error);
        alert('AI 解析出错，请确保配置了正确的 API Key，并且任务信息完整。');
        setIsAIBreakdownModalOpen(false);
    } finally {
        setIsAIBreakdownLoading(false);
    }
  };

  const handleConfirmAIBreakdown = async () => {
    setIsSaving(true);
    const newPlans = aiBreakdownTasks.map((t, idx) => ({
        id: Date.now().toString() + "_" + idx,
        date: t.date,
        start: t.start || '09:00',
        end: t.end || '10:00',
        module: t.module || '学习',
        sub: 'AI拆解',
        content: t.content,
        tag: '重要',
        relatedEventId: aiBreakdownEvent.id,
        relatedEventTitle: aiBreakdownEvent.title,
        attachments: [],
        status: 'pending',
        reflection: null,
        checklist: t.checklist || [] 
    }));

    const updatedPlans = [...plans, ...newPlans];
    setPlans(updatedPlans);
    await saveToCloud(updatedPlans);
    
    setIsAIBreakdownModalOpen(false);
    setAiBreakdownEvent(null);
    setAiBreakdownTasks([]);
    setIsSaving(false);
    
    setViewMode('list');
    setCurrentDate(aiBreakdownEvent.startDate);
  };

  const handleAIDailySchedule = async () => {
    const dayPlans = plans.filter(p => p.date === currentDate);
    if (dayPlans.length === 0) {
        alert("今天还没有计划，无法进行智能排期！");
        return;
    }

    if (VOLCENGINE_API_KEY === 'API_KEY' || VOLCENGINE_ENDPOINT === 'ENDPOINT') {
        alert("⚠️ 发现您还没有填入真实的 API Key 和 Endpoint！\n请在代码顶部的配置区替换为您自己的火山引擎 API 信息。");
        return;
    }

    setIsAIDailyScheduleModalOpen(true);
    setIsAIDailyScheduleLoading(true);
    setAiDailyScheduleTasks([]);

    const taskData = dayPlans.map(p => {
        const isClass = p.sub === '课程' || p.content.includes('课');
        const isMealOrSleep = p.content.includes('饭') || p.content.includes('餐') || p.content.includes('睡');
        
        let constraint = '可自由调整时间';
        if (isClass) constraint = '绝对不能修改时间';
        else if (isMealOrSleep) constraint = '尽量不要修改时间，维持在常规时段';

        return {
            id: p.id,
            content: p.content,
            start: p.start,
            end: p.end,
            constraint: constraint
        };
    });

    const prompt = `你是一个专业的时间管理专家。请帮我对以下任务进行一天的合理时间规划。
    下面是今天的任务列表，包含任务ID、内容、当前设定的起止时间以及时间修改约束。

    【排期规则】：
    1. "绝对不能修改时间" 的任务，必须保持原有的 start 和 end，一分钟都不能差！
    2. "尽量不要修改时间" 的任务，可以微调，但必须在原有的大致时间段（如中午吃饭就在中午）。
    3. "可自由调整时间" 的任务，请根据任务内容常识，为其分配合理的时间段和时长，尽量填补空闲时间。
    4. ⚠️ 核心要求：所有任务的时间绝对不能产生任何重叠！
    5. 时间范围通常在 06:00 到 23:59 之间。

    请严格按照以下 JSON 数组格式输出，不要返回任何 Markdown 标记(如 \`\`\`json )，也不要包含任何说明文字：
    [
      {
        "id": "原任务的ID",
        "start": "HH:mm",
        "end": "HH:mm"
      }
    ]

    任务列表：
    ${JSON.stringify(taskData, null, 2)}
    `;

    try {
        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VOLCENGINE_API_KEY}`
            },
            body: JSON.stringify({
                model: VOLCENGINE_ENDPOINT,
                messages: [
                    { role: 'system', content: '你是一个严格输出 JSON 格式的时间规划助手，擅长安排不重叠的时间表。' },
                    { role: 'user', content: prompt }
                ]
            })
        });

        // 🌟 将服务器返回内容作为纯文本读取
        const rawText = await response.text();
        
        let data;
        try {
            // 尝试将其解析为 JSON
            data = JSON.parse(rawText);
        } catch {
            // ❌ 如果解析失败，打印出服务器到底返回了什么鬼东西！
            console.error("⛔【致命错误】AI 接口未返回 JSON。");
            console.error("HTTP 状态码:", response.status);
            console.error("服务器返回的真实内容原文:\n", rawText);
            
            throw new Error(`服务器返回了非标准的响应 (HTTP ${response.status})。\n\n返回内容片段: ${rawText.substring(0, 60)}...\n\n👉 请按 F12 打开开发者工具，在 Console (控制台) 中查看完整的返回原文，以确定是参数填错还是网络被拦截！`);
        }

        if (!response.ok || data.error) {
            throw new Error(data.error?.message || `请求被拒绝，状态码：${response.status}`);
        }

        if (!data.choices || data.choices.length === 0) {
            throw new Error("AI 没有返回任何有效内容！");
        }

        let aiText = data.choices[0].message.content.trim();

        let jsonStr = aiText;
        const jsonMatch = aiText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        } else {
            jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        let parsedResults;
        try {
            parsedResults = JSON.parse(jsonStr);
        } catch {
            console.error("AI 生成的错误格式文本:", aiText);
            throw new Error("AI 没有按要求返回 JSON 格式，解析失败。");
        }

        if (!Array.isArray(parsedResults)) {
            throw new Error("AI 返回的数据不是数组格式！");
        }
        
        const mergedTasks = dayPlans.map(p => {
            const aiResult = parsedResults.find(r => r.id === p.id);
            return {
                ...p,
                newStart: aiResult ? aiResult.start : p.start,
                newEnd: aiResult ? aiResult.end : p.end
            };
        }).sort((a, b) => a.newStart.localeCompare(b.newStart));

        setAiDailyScheduleTasks(mergedTasks);

    } catch (error) {
        console.error('AI 智能排期失败详细信息:', error);
        alert('❌ 排期失败：\n' + error.message);
        setIsAIDailyScheduleModalOpen(false);
    } finally {
        setIsAIDailyScheduleLoading(false);
    }
  };

  const handleConfirmAIDailySchedule = async () => {
      setIsSaving(true);
      let updatedPlans = [...plans];
      
      aiDailyScheduleTasks.forEach(aiTask => {
          const idx = updatedPlans.findIndex(p => p.id === aiTask.id);
          if (idx !== -1) {
              updatedPlans[idx] = { ...updatedPlans[idx], start: aiTask.newStart, end: aiTask.newEnd };
          }
      });

      setPlans(updatedPlans);
      await saveToCloud(updatedPlans);
      
      setIsAIDailyScheduleModalOpen(false);
      setAiDailyScheduleTasks([]);
      setIsSaving(false);
  };

  // --- 处理 CSV 和 Excel 本地课表上传与解析 ---
  const handleScheduleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');

    if (!isCSV && !isExcel) {
        alert("格式错误：请务必选择 .csv, .xls 或 .xlsx 格式的课表文件！\n如果您看到文件被识别为未知类型，请确认文件后缀。");
        e.target.value = ''; 
        return;
    }

    setIsParsingSchedule(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
        try {
            let csvText = '';
            
            if (isCSV) {
                csvText = evt.target.result; 
            } else {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                // 🌟 核心优化1: 强制 Excel 解析引擎将日期格式化为标准的 YYYY-MM-DD
                csvText = XLSX.utils.sheet_to_csv(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
            }
            
            await processScheduleLocal(csvText);
        } catch (err) {
            console.error(err);
            alert("解析文件内容失败，请确保格式和编码正确！");
            setIsParsingSchedule(false);
        }
    };
    
    if (isCSV) {
        reader.readAsText(file, 'UTF-8'); 
    } else {
        reader.readAsArrayBuffer(file);
    }
    
    e.target.value = ''; 
  };

  // --- 纯本地课表解析 (增强纠错版) ---
  const processScheduleLocal = async (csvData) => {
    setIsParsingSchedule(true);
    
    try {
        const parseCSVLine = (text) => {
            const result = [];
            let inQuotes = false;
            let value = '';
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') {
                    if (inQuotes && text[i+1] === '"') { value += '"'; i++; } 
                    else { inQuotes = !inQuotes; }
                } else if (char === ',' && !inQuotes) {
                    result.push(value);
                    value = '';
                } else {
                    value += char;
                }
            }
            result.push(value);
            return result.map(v => v.trim());
        };

        const lines = csvData.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            alert("未识别到有效数据，请确保文件包含表头和具体课程数据！");
            setIsParsingSchedule(false);
            return;
        }

        const headers = parseCSVLine(lines[0]);
        const nameIdx = headers.findIndex(h => h.includes('课程') || h.includes('名'));
        const teacherIdx = headers.findIndex(h => h.includes('教师') || h.includes('老师'));
        const locationIdx = headers.findIndex(h => h.includes('地点') || h.includes('教室'));
        const dateIdx = headers.findIndex(h => h.includes('日期'));
        const periodIdx = headers.findIndex(h => h.includes('节次'));
        
        if (nameIdx === -1 || dateIdx === -1 || periodIdx === -1) {
            alert(`表头识别失败！\n请确保表头包含“课程名称”、“上课日期”和“节次”。\n当前您的表头是: ${headers.join(', ')}`);
            setIsParsingSchedule(false);
            return;
        }

        const PERIOD_MAP = {
            1: { start: '08:30', end: '09:15' },
            2: { start: '09:20', end: '10:05' },
            3: { start: '10:25', end: '11:10' },
            4: { start: '11:15', end: '12:00' },
            5: { start: '13:50', end: '14:35' },
            6: { start: '14:40', end: '15:25' },
            7: { start: '15:30', end: '16:15' },
            8: { start: '16:30', end: '17:15' },
            9: { start: '17:20', end: '18:05' },
            10: { start: '18:30', end: '19:15' },
            11: { start: '19:20', end: '20:05' },
            12: { start: '20:10', end: '20:55' }
        };

        const parsedTasks = [];
        let skippedCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            if (row.length === 0 || !row[nameIdx]) continue;

            const name = row[nameIdx] || '未知课程';
            const teacher = teacherIdx !== -1 && row[teacherIdx] ? row[teacherIdx] : '未知教师';
            const location = locationIdx !== -1 && row[locationIdx] ? row[locationIdx] : '未知地点';
            const dateStr = row[dateIdx] || '';
            const periodStr = row[periodIdx] || '';

            // --- A. 解析日期 (完全兼容 Excel 各种可能输出的日期格式) ---
            let targetDateStr = '';
            const cleanDateStr = dateStr.trim().split(' ')[0]; // 去除时间后缀如 00:00:00
            
            const dateMatch1 = cleanDateStr.match(/(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})/); 
            const dateMatch2 = cleanDateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/); 
            const dateMatch3 = cleanDateStr.match(/(\d{4})(\d{2})(\d{2})/);

            if (dateMatch1) {
                targetDateStr = `${dateMatch1[1]}-${dateMatch1[2].padStart(2, '0')}-${dateMatch1[3].padStart(2, '0')}`;
            } else if (dateMatch2) {
                targetDateStr = `${dateMatch2[3]}-${dateMatch2[1].padStart(2, '0')}-${dateMatch2[2].padStart(2, '0')}`;
            } else if (dateMatch3) {
                targetDateStr = `${dateMatch3[1]}-${dateMatch3[2]}-${dateMatch3[3]}`;
            }

            if (!targetDateStr) {
                skippedCount++;
                continue; 
            }

            // --- B. 解析节次 (🌟 核心优化2: 安全的节次匹配机制) ---
            const periods = [];
            // 1. 优先提取 03, 04 这种双位数格式
            const doubleDigitMatches = periodStr.match(/\d{2}/g);
            if (doubleDigitMatches) {
                doubleDigitMatches.forEach(m => periods.push(parseInt(m, 10)));
            } else {
                // 2. 兼容 5, 1-2 这种单数格式
                const singleMatches = periodStr.match(/\d+/g);
                if (singleMatches) {
                    singleMatches.forEach(m => periods.push(parseInt(m, 10)));
                }
            }

            // 过滤出 1 到 12 范围内的有效节次
            const validPeriods = periods.filter(p => p >= 1 && p <= 12);
            if (validPeriods.length === 0) {
                skippedCount++;
                continue;
            }

            const startPeriod = Math.min(...validPeriods);
            const endPeriod = Math.max(...validPeriods);

            // 安全防崩溃校验
            if (!PERIOD_MAP[startPeriod] || !PERIOD_MAP[endPeriod]) {
                skippedCount++;
                continue;
            }

            // 拼接所有信息作为计划的内容
            const fullContent = `${name} (教师: ${teacher} | 地点: ${location} | 节次: ${periodStr})`;
            
            parsedTasks.push({
                date: targetDateStr,
                start: PERIOD_MAP[startPeriod].start,
                end: PERIOD_MAP[endPeriod].end,
                content: fullContent
            });
        }

        if (parsedTasks.length === 0) {
            alert(`解析失败。\n表格中没有找到符合标准日期(YYYY-MM-DD)或节次(0304)的有效课程。\n有 ${skippedCount} 条数据被跳过。`);
            setIsParsingSchedule(false);
            return;
        }

        const newPlans = parsedTasks.map((t, idx) => ({
            id: Date.now().toString() + "_" + idx,
            date: t.date,
            start: t.start,
            end: t.end,
            module: '学习',
            sub: '课程',
            content: t.content,
            tag: '重要',
            attachments: [],
            status: 'pending',
            reflection: null,
            checklist: [] 
        }));

        const updatedPlans = [...plans, ...newPlans];
        setPlans(updatedPlans);
        await saveToCloud(updatedPlans);
        
        setIsScheduleModalOpen(false);
        alert(`🎉 成功导入了 ${newPlans.length} 节课程！\n各课程已按真实日期分配。（跳过了 ${skippedCount} 条无效数据）`);

    } catch (error) {
        console.error('课表解析异常:', error);
        alert(`本地解析出错: ${error.message}\n请检查课表文件内容是否规范。`);
    } finally {
        setIsParsingSchedule(false);
    }
  };

  const renderCalendar = () => {
      const year = currentCalendarDate.getFullYear();
      const month = currentCalendarDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const startDay = getFirstDayOfMonth(year, month);
      const totalSlots = Math.ceil((daysInMonth + startDay) / 7) * 7;
      
      const grid = [];
      for (let i = 0; i < totalSlots; i++) {
          const dayNum = i - startDay + 1;
          const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
          
          if (!isCurrentMonth) {
              grid.push(<div key={i} className="bg-slate-50/30 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800 min-h-[100px]"></div>);
              continue;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;

          const dayEvents = calendarEvents.filter(e => dateStr >= e.startDate && dateStr <= e.endDate);
          
          const filteredEvents = searchTerm 
            ? dayEvents.filter(e => e.title.includes(searchTerm) || e.description?.includes(searchTerm)) 
            : dayEvents;

          grid.push(
              <div 
                  key={i} 
                  className={`border border-slate-100 dark:border-slate-800 min-h-[100px] p-1.5 transition-colors relative group hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-900'}`}
                  onClick={(e) => { 
                      if(e.target === e.currentTarget) {
                          setEditingEvent({ startDate: dateStr, endDate: dateStr }); 
                          setIsEventModalOpen(true); 
                      }
                  }}
              >
                  <div className={`text-right text-xs font-bold mb-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {isToday ? <span className="bg-indigo-600 dark:bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center inline-block shadow-sm shadow-indigo-200 dark:shadow-none">{dayNum}</span> : dayNum}
                  </div>
                  <div className="space-y-1">
                      {filteredEvents.map(ev => {
                          const colorObj = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[0];
                          return (
                              <button 
                                  key={ev.id}
                                  onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setIsEventModalOpen(true); }}
                                  className={`w-full text-left text-[10px] px-1.5 py-1 rounded border truncate font-medium ${colorObj.bg} ${colorObj.text} ${colorObj.border} hover:opacity-80 transition-opacity flex items-center gap-1`}
                              >
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorObj.dot}`}></div>
                                  {ev.title}
                              </button>
                          );
                      })}
                  </div>
                  <button 
                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
                    onClick={(e) => { e.stopPropagation(); setEditingEvent({ startDate: dateStr, endDate: dateStr }); setIsEventModalOpen(true); }}
                  >
                      <Plus size={14}/>
                  </button>
              </div>
          );
      }
      return grid;
  };

  const renderProjectGantt = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    
    const monthStartStr = `${year}-${String(month+1).padStart(2,'0')}-01`;
    const monthEndStr = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`;
    
    const ganttEvents = calendarEvents.filter(e => {
       return e.endDate >= monthStartStr && e.startDate <= monthEndStr;
    }).sort((a,b) => a.startDate.localeCompare(b.startDate));
    
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const colWidth = 40; 
    const leftPanelWidth = 192; 

    return (
       <div className="flex flex-col h-full overflow-hidden">
           <div className="flex-1 overflow-auto custom-scrollbar relative">
               <div className="min-w-max">
                  <div className="flex sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                     <div className="sticky left-0 w-48 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-3 font-bold text-xs text-slate-500 dark:text-slate-400 z-30 shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] flex items-center">
                         任务名称
                     </div>
                     {days.map(d => {
                        const isToday = d === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth();
                        return (
                          <div key={d} className={`w-10 border-r border-slate-200 dark:border-slate-700 p-2 text-center text-xs font-bold shrink-0 ${isToday ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                              {d}
                          </div>
                        );
                     })}
                  </div>
                  
                  {ganttEvents.length === 0 ? (
                      <div className="p-10 text-slate-400 dark:text-slate-500 text-sm italic ml-48">本月没有跨日任务</div>
                  ) : (
                      ganttEvents.map(ev => {
                          const start = new Date(ev.startDate);
                          const end = new Date(ev.endDate);
                          const monthStart = new Date(year, month, 1);
                          const monthEnd = new Date(year, month, daysInMonth);
                          
                          const effectiveStart = start < monthStart ? monthStart : start;
                          const effectiveEnd = end > monthEnd ? monthEnd : end;
                          
                          const startDay = effectiveStart.getDate(); 
                          const endDay = effectiveEnd.getDate();
                          const duration = endDay - startDay + 1;
                          const offset = startDay - 1;
                          
                          const colorObj = EVENT_COLORS.find(c => c.id === ev.color) || EVENT_COLORS[0];

                          return (
                              <div key={ev.id} className="flex relative hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 h-11 group">
                                  <div className="sticky left-0 w-48 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-3 text-sm font-medium text-slate-700 dark:text-slate-300 z-20 flex items-center gap-2 shadow-[4px_0_12px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_rgba(0,0,0,0.2)] transition-colors">
                                      <div className={`w-2 h-2 rounded-full ${colorObj.dot} shrink-0`}></div>
                                      <span className="truncate" title={ev.title}>{ev.title}</span>
                                  </div>
                                  
                                  <div className="flex absolute inset-0 left-48 right-0 pointer-events-none">
                                      {days.map(d => {
                                           const isToday = d === new Date().getDate() && year === new Date().getFullYear() && month === new Date().getMonth();
                                           return <div key={d} className={`w-10 border-r border-slate-50 dark:border-slate-800 shrink-0 h-full ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-900/10' : ''}`}></div>;
                                      })}
                                  </div>
                                  
                                  <div 
                                      className={`absolute top-2 h-7 rounded-md border ${colorObj.bg} ${colorObj.border} flex items-center px-2 cursor-pointer z-10 transition-all hover:brightness-95 hover:scale-[1.01] hover:shadow-sm`}
                                      style={{
                                          left: `${leftPanelWidth + (offset * colWidth)}px`,
                                          width: `${duration * colWidth}px`
                                      }}
                                      onClick={() => { setEditingEvent(ev); setIsEventModalOpen(true); }}
                                      title={`${ev.title} (${ev.startDate} ~ ${ev.endDate})`}
                                  >
                                      <span className={`text-[10px] font-bold ${colorObj.text} truncate`}>{ev.title}</span>
                                  </div>
                              </div>
                          );
                      })
                  )}
               </div>
           </div>
           <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 flex justify-between shrink-0">
               <span>总计: {ganttEvents.length} 个任务</span>
               <span>提示: 左右滑动查看跨日进度，点击条形图可编辑</span>
           </div>
       </div>
    );
  };

  const renderDailyGantt = () => {
    const dailyPlans = plans.filter(p => p.date === currentDate).sort((a, b) => a.start.localeCompare(b.start));
    const hours = Array.from({ length: 25 }, (_, i) => i); 
    const colWidth = 60; 
    const leftPanelWidth = 140; 

    const getLeftPx = (time) => {
        if (!time) return 0;
        const [h, m] = time.split(':').map(Number);
        return h * colWidth + (m / 60) * colWidth;
    };

    const moduleStats = {};
    let totalMinutes = 0;
    dailyPlans.forEach(plan => {
        const duration = calculateDuration(plan.start, plan.end);
        const mod = plan.module || '其他';
        if (!moduleStats[mod]) moduleStats[mod] = 0;
        moduleStats[mod] += duration;
        totalMinutes += duration;
    });

    const MODULE_COLORS = { '工作': 'bg-blue-500', '学习': 'bg-indigo-500', '生活': 'bg-emerald-500', '运动': 'bg-orange-500', '其他': 'bg-slate-500' };
    const statEntries = Object.entries(moduleStats).sort((a, b) => b[1] - a[1]);

    const isToday = currentDate === todayStr;
    const now = new Date();
    const currentPx = isToday ? (now.getHours() + now.getMinutes() / 60) * colWidth : -1;

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in">
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <div className="min-w-max" style={{ width: leftPanelWidth + 24 * colWidth }}>
                    <div className="flex sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
                       <div className="sticky left-0 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-3 font-bold text-xs text-slate-500 dark:text-slate-400 z-40 flex items-center justify-center shrink-0" style={{ width: leftPanelWidth }}>
                           当天任务
                       </div>
                       <div className="relative h-10 flex-1 bg-slate-50 dark:bg-slate-800">
                           {hours.map(h => (
                               <div key={h} className="absolute top-0 bottom-0 border-l border-slate-200 dark:border-slate-700 flex justify-center text-[10px] text-slate-400 dark:text-slate-500 font-medium pt-2 pointer-events-none" style={{ left: h * colWidth, width: colWidth }}>
                                   {String(h).padStart(2, '0')}:00
                               </div>
                           ))}
                       </div>
                    </div>

                    <div className="relative flex min-h-[300px]">
                        <div className="sticky left-0 z-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0" style={{ width: leftPanelWidth }}>
                            {dailyPlans.map(plan => {
                                const isCompleted = plan.status === 'completed';
                                return (
                                    <div key={plan.id} className="h-14 border-b border-slate-100 dark:border-slate-800 p-2 flex flex-col justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}>
                                        <span className={`text-xs font-bold truncate ${isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`} title={plan.content}>{plan.content}</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{plan.start} - {plan.end}</span>
                                    </div>
                                )
                            })}
                            {dailyPlans.length === 0 && <div className="p-4 text-xs text-slate-400 dark:text-slate-500">暂无日内安排</div>}
                        </div>

                        <div className="relative flex-1 bg-white dark:bg-slate-900">
                            <div className="absolute inset-0 pointer-events-none flex">
                                {hours.slice(0, 24).map(h => (
                                   <div key={h} className="border-l border-slate-50 dark:border-slate-800/50 h-full shrink-0" style={{ width: colWidth }}></div>
                                ))}
                            </div>

                            {isToday && currentPx >= 0 && (
                                <div className="absolute top-0 bottom-0 border-l-2 border-red-400/60 z-10 pointer-events-none" style={{ left: currentPx }}>
                                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                                </div>
                            )}

                            <div className="flex flex-col">
                                {dailyPlans.map(plan => {
                                    const startPx = getLeftPx(plan.start);
                                    const endPx = getLeftPx(plan.end);
                                    const widthPx = Math.max(endPx - startPx, 4); 
                                    const isCompleted = plan.status === 'completed';

                                    return (
                                        <div key={plan.id} className="h-14 border-b border-slate-100 dark:border-slate-800 relative group hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                            <div
                                                className={`absolute top-2.5 h-9 rounded-md border flex flex-col justify-center px-2 cursor-pointer z-10 transition-all hover:brightness-95 hover:shadow-md ${
                                                    isCompleted ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500' : 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-sm dark:shadow-none'
                                                }`}
                                                style={{ left: startPx, width: widthPx }}
                                                onClick={() => { setEditingPlan(plan); setIsModalOpen(true); }}
                                                title={`${plan.content}\n耗时: ${plan.start} - ${plan.end}`}
                                            >
                                                {widthPx > 30 && (
                                                    <span className="text-[10px] font-bold truncate">
                                                        {plan.module} {plan.sub && `· ${plan.sub}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {statEntries.length > 0 && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                        <Layers size={14}/> 模块时间分配
                    </h4>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                        {statEntries.map(([mod, mins]) => (
                            <div 
                                key={mod} 
                                className={`h-full ${MODULE_COLORS[mod] || 'bg-slate-500'}`} 
                                style={{ width: `${(mins / totalMinutes) * 100}%` }}
                                title={`${mod}: ${Math.floor(mins/60)}h ${mins%60}m`}
                            ></div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {statEntries.map(([mod, mins]) => (
                            <div key={mod} className="flex items-center gap-1.5 text-xs">
                                <span className={`w-2.5 h-2.5 rounded-full ${MODULE_COLORS[mod] || 'bg-slate-500'}`}></span>
                                <span className="text-slate-600 dark:text-slate-300 font-medium">{mod}</span>
                                <span className="text-slate-400 dark:text-slate-500 font-mono">
                                    {Math.floor(mins/60)}<span className="text-[10px]">h</span> {mins%60}<span className="text-[10px]">m</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 flex justify-between shrink-0">
               <span>日内排布: 共 {dailyPlans.length} 个任务，总计 {Math.floor(totalMinutes/60)}h {totalMinutes%60}m</span>
               <span className="flex items-center gap-2">
                 {isToday && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> 当前时间</span>}
                 提示: 左右滑动查看全天时间分布，排查时间重叠
               </span>
           </div>
        </div>
    );
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>;

  const isViewingPast = currentDate < todayStr;
  const getTagStyle = (tag) => {
    switch(tag) {
      case '紧急': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800';
      case '重要': return 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800';
      case '休闲': return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800';
      default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in">
      
      {/* 导入 CSV/Excel 课表弹窗 */}
      {isScheduleModalOpen && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
                  <div className="p-5 border-b border-emerald-100 dark:border-emerald-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/30">
                      <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                          <FileSpreadsheet size={20}/> 自动导入课表
                      </h3>
                      <button onClick={() => setIsScheduleModalOpen(false)}><X size={20} className="text-emerald-400 dark:text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-300"/></button>
                  </div>
                  
                  <div className="p-6">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                          支持上传 <b>.csv</b>, <b>.xls</b>, <b>.xlsx</b> 格式的课表。<br/>
                          系统会自动识别您的上课节次（如：05060708）并准确转换为实际时间，一键生成每日计划。
                      </p>
                      
                      <div className="relative group mt-2">
                          <input 
                              type="file" 
                              accept="*" 
                              onChange={handleScheduleUpload} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                              disabled={isParsingSchedule}
                          />
                          <div className={`w-full border-2 border-dashed border-emerald-200 dark:border-emerald-800 p-8 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 text-sm flex flex-col items-center justify-center gap-3 transition-colors ${isParsingSchedule ? 'opacity-50' : 'group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'}`}>
                             {isParsingSchedule ? (
                                 <Loader2 size={32} className="animate-spin text-emerald-500 dark:text-emerald-400"/>
                             ) : (
                                 <FileSpreadsheet size={32} className="text-emerald-500 dark:text-emerald-400"/>
                             )}
                             <span className="font-bold text-emerald-600 dark:text-emerald-400 text-center">
                                 {isParsingSchedule ? '正在解析您的课表，请稍候...' : '点击或拖拽课表文件到此处'}
                             </span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* AI 智能拆解弹窗 */}
      {isAIBreakdownModalOpen && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
                  <div className="p-5 border-b border-purple-100 dark:border-purple-800 flex justify-between items-center bg-purple-50 dark:bg-purple-900/30 shrink-0">
                      <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2"><Sparkles size={20}/> AI 智能任务拆解</h3>
                      <button onClick={() => setIsAIBreakdownModalOpen(false)}><X size={20} className="text-purple-400 dark:text-purple-500 hover:text-purple-600 dark:hover:text-purple-300"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-800/30">
                      {isAIBreakdownLoading ? (
                          <div className="flex flex-col items-center justify-center h-48 text-purple-500 dark:text-purple-400">
                              <Loader2 size={40} className="animate-spin mb-4" />
                              <p className="font-bold">AI 正在努力分析与拆解您的任务...</p>
                              <p className="text-xs text-purple-400 dark:text-purple-500 mt-2">基于任务时长与目标，为您量身定制每日计划</p>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 p-4 rounded-xl text-sm mb-4 border border-purple-100 dark:border-purple-800 shadow-sm flex flex-col gap-1">
                                  <span><b>目标项目：</b>{aiBreakdownEvent?.title}</span>
                                  <span className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-1">
                                      <CalendarRange size={12}/> {aiBreakdownEvent?.startDate} 至 {aiBreakdownEvent?.endDate}
                                  </span>
                              </div>
                              
                              {aiBreakdownTasks.map((t, idx) => (
                                  <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3 group hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                              第 {idx + 1} 天 ({t.date})
                                          </div>
                                          <input 
                                              value={t.content} 
                                              onChange={(e) => {
                                                  const newTasks = [...aiBreakdownTasks];
                                                  newTasks[idx].content = e.target.value;
                                                  setAiBreakdownTasks(newTasks);
                                              }}
                                              className="flex-1 bg-transparent border-b border-transparent focus:border-purple-300 dark:focus:border-purple-500/50 outline-none font-bold text-slate-800 dark:text-slate-100 transition-colors text-sm"
                                          />
                                          <button 
                                              onClick={() => setAiBreakdownTasks(aiBreakdownTasks.filter(item => item.id !== t.id))}
                                              className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0"
                                          >
                                              <Trash2 size={16}/>
                                          </button>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs">
                                          <input type="time" value={t.start} onChange={(e) => {
                                                  const newTasks = [...aiBreakdownTasks];
                                                  newTasks[idx].start = e.target.value;
                                                  setAiBreakdownTasks(newTasks);
                                              }} className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-md outline-none focus:border-purple-300 dark:focus:border-purple-500/50 bg-slate-50 dark:bg-slate-800" />
                                          <span className="text-slate-400 dark:text-slate-500">至</span>
                                          <input type="time" value={t.end} onChange={(e) => {
                                                  const newTasks = [...aiBreakdownTasks];
                                                  newTasks[idx].end = e.target.value;
                                                  setAiBreakdownTasks(newTasks);
                                              }} className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-md outline-none focus:border-purple-300 dark:focus:border-purple-500/50 bg-slate-50 dark:bg-slate-800" />
                                          
                                          <select value={t.module} onChange={(e) => {
                                                  const newTasks = [...aiBreakdownTasks];
                                                  newTasks[idx].module = e.target.value;
                                                  setAiBreakdownTasks(newTasks);
                                              }} className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 p-1.5 rounded-md outline-none focus:border-purple-300 dark:focus:border-purple-500/50 bg-slate-50 dark:bg-slate-800 ml-auto">
                                              <option>工作</option><option>学习</option><option>生活</option><option>运动</option><option>其他</option>
                                          </select>
                                      </div>

                                      {/* 展示并允许编辑大模型生成的 Checklist 子步骤 */}
                                      <div className="mt-1 pl-2 border-l-2 border-purple-200 dark:border-purple-800/50 space-y-1.5">
                                          {(t.checklist || []).map((c, cIdx) => (
                                              <div key={c.id || cIdx} className="flex items-center gap-2 text-xs group/chk">
                                                  <Circle size={12} className="text-purple-400 shrink-0"/>
                                                  <input 
                                                      value={c.text} 
                                                      onChange={(e) => {
                                                          const newTasks = [...aiBreakdownTasks];
                                                          newTasks[idx].checklist[cIdx].text = e.target.value;
                                                          setAiBreakdownTasks(newTasks);
                                                      }}
                                                      className="flex-1 bg-transparent border-b border-transparent focus:border-purple-300 dark:focus:border-purple-500/50 outline-none text-slate-600 dark:text-slate-300 transition-colors"
                                                      placeholder="子任务描述..."
                                                  />
                                                  <button 
                                                      onClick={() => {
                                                          const newTasks = [...aiBreakdownTasks];
                                                          newTasks[idx].checklist.splice(cIdx, 1);
                                                          setAiBreakdownTasks(newTasks);
                                                      }}
                                                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover/chk:opacity-100 transition-opacity shrink-0"
                                                  >
                                                      <X size={12}/>
                                                  </button>
                                              </div>
                                          ))}
                                          <button 
                                              onClick={() => {
                                                  const newTasks = [...aiBreakdownTasks];
                                                  if (!newTasks[idx].checklist) newTasks[idx].checklist = [];
                                                  newTasks[idx].checklist.push({ id: Date.now() + Math.random().toString(), text: '新子步骤', completed: false });
                                                  setAiBreakdownTasks(newTasks);
                                              }}
                                              className="text-[10px] text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 mt-1"
                                          >
                                              <Plus size={10}/> 添加子步骤
                                          </button>
                                      </div>

                                  </div>
                              ))}
                              
                              <button 
                                  onClick={() => {
                                      const lastTaskDate = aiBreakdownTasks.length > 0 ? aiBreakdownTasks[aiBreakdownTasks.length-1].date : aiBreakdownEvent.startDate;
                                      setAiBreakdownTasks([...aiBreakdownTasks, { id: Date.now().toString(), date: lastTaskDate, content: '新增计划', start: '09:00', end: '10:00', module: '学习', checklist: [] }]);
                                  }}
                                  className="w-full py-3 border-2 border-dashed border-purple-200 dark:border-purple-800 text-purple-500 dark:text-purple-400 font-bold rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors flex items-center justify-center gap-2 text-sm mt-4"
                              >
                                  <Plus size={16}/> 手动追加一条拆解
                              </button>
                          </div>
                      )}
                  </div>
                  
                  {!isAIBreakdownLoading && (
                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                          <button onClick={() => setIsAIBreakdownModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">放弃生成</button>
                          <button onClick={handleConfirmAIBreakdown} disabled={isSaving || aiBreakdownTasks.length === 0} className="px-8 py-2.5 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none transition-transform active:scale-95 disabled:bg-purple-300 dark:disabled:bg-purple-800 flex items-center gap-2">
                              {isSaving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} 
                              确认生成 {aiBreakdownTasks.length} 个计划
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* AI 单日智能排期弹窗 */}
      {isAIDailyScheduleModalOpen && (
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
                  <div className="p-5 border-b border-indigo-100 dark:border-indigo-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
                      <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2"><Wand2 size={20}/> AI 智能排期 ({currentDate})</h3>
                      <button onClick={() => setIsAIDailyScheduleModalOpen(false)}><X size={20} className="text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-800/30">
                      {isAIDailyScheduleLoading ? (
                          <div className="flex flex-col items-center justify-center h-48 text-indigo-500 dark:text-indigo-400">
                              <Loader2 size={40} className="animate-spin mb-4" />
                              <p className="font-bold">AI 正在根据您的计划内容智能规划时间...</p>
                              <p className="text-xs text-indigo-400 dark:text-indigo-500 mt-2">严格遵守上课时间不动，吃饭睡觉少动原则</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              <div className="text-sm text-slate-500 dark:text-slate-400 mb-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
                                  <Sparkles size={16} className="text-indigo-500"/>
                                  AI 已为您重新安排了今日计划。您可以核对并在下方直接微调时间，确认无误后保存。
                              </div>
                              {aiDailyScheduleTasks.map((t, idx) => (
                                  <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:border-indigo-300 transition-colors">
                                      <div className="flex-1 min-w-0">
                                          <div className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm mb-1">{t.content}</div>
                                          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{t.module}</span>
                                              <span className="line-through opacity-70">原时间: {t.start} - {t.end}</span>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 bg-indigo-50/50 dark:bg-indigo-900/20 p-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                                          <input type="time" value={t.newStart} onChange={(e) => {
                                                  const newTasks = [...aiDailyScheduleTasks];
                                                  newTasks[idx].newStart = e.target.value;
                                                  setAiDailyScheduleTasks(newTasks);
                                              }} className="bg-transparent border-none text-indigo-700 dark:text-indigo-300 font-bold p-1 rounded-md outline-none focus:ring-1 focus:ring-indigo-300 text-sm cursor-pointer" />
                                          <span className="text-indigo-300 dark:text-indigo-600 font-bold">-</span>
                                          <input type="time" value={t.newEnd} onChange={(e) => {
                                                  const newTasks = [...aiDailyScheduleTasks];
                                                  newTasks[idx].newEnd = e.target.value;
                                                  setAiDailyScheduleTasks(newTasks);
                                              }} className="bg-transparent border-none text-indigo-700 dark:text-indigo-300 font-bold p-1 rounded-md outline-none focus:ring-1 focus:ring-indigo-300 text-sm cursor-pointer" />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  {!isAIDailyScheduleLoading && (
                      <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                          <button onClick={() => setIsAIDailyScheduleModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">取消</button>
                          <button onClick={handleConfirmAIDailySchedule} disabled={isSaving || aiDailyScheduleTasks.length === 0} className="px-8 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 flex items-center gap-2">
                              {isSaving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} 
                              确认并更新时间
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}

      <ModuleManager isOpen={isModuleMgrOpen} onClose={() => setIsModuleMgrOpen(false)} modules={modules} onSaveModule={handleSaveModule} onDeleteModule={handleDeleteModule} />
      
      <CalendarEventModal 
          isOpen={isEventModalOpen} 
          onClose={() => setIsEventModalOpen(false)} 
          event={editingEvent} 
          onSave={handleSaveEvent} 
          onDelete={handleDeleteEvent} 
          onPlanDaily={handlePlanDaily} 
          onAIBreakdown={handleAIBreakdown} 
          relatedPlans={relatedPlansForEvent} 
          uploadToCloudinary={uploadToCloudinary}
      />

      {/* 顶部控制栏 */}
      <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        
        {/* 第一行：标题与副标题 */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400"><Calendar size={22}/></div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">任务计划</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs">管理日程与待办事项</p>
          </div>
        </div>
        
        {/* 第二行：所有的操作按钮（搜索、排期、新增等） */}
        <div className="flex flex-col md:flex-row gap-3 flex-1 xl:justify-end">
            <div className="bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center">
                <div className="flex items-center gap-0.5 border-r border-slate-200 dark:border-slate-700 pr-1 mr-1">
                    <button onClick={() => setViewMode('list')} title="单日任务列表" className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <List size={18}/> 
                    </button>
                    <button onClick={() => setViewMode('daily_gantt')} title="日内时间分配图" className={`p-2 rounded-lg transition-all ${viewMode === 'daily_gantt' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <GanttChart size={18}/> 
                    </button>
                </div>
                <div className="flex items-center gap-0.5 pl-1">
                    <button onClick={() => setViewMode('calendar')} title="跨日项目日历" className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <CalendarRange size={18}/> 
                    </button>
                    <button onClick={() => setViewMode('project_gantt')} title="跨日项目排期 (甘特图)" className={`p-2 rounded-lg transition-all ${viewMode === 'project_gantt' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        <GanttChartSquare size={18}/> 
                    </button>
                </div>
            </div>

            <div className="relative group flex-1 md:flex-none">
                <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                <input type="text" placeholder={(viewMode === 'list' || viewMode === 'daily_gantt') ? "查找单日计划..." : "搜索跨日任务..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 w-full md:w-56 transition-all dark:text-slate-200" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><X size={16}/></button>}
            </div>

            {(viewMode === 'list' || viewMode === 'daily_gantt') ? (
                <>
                    {viewMode === 'list' && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <ArrowUpDown size={16} className="text-slate-400 dark:text-slate-500"/>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"><option value="time">时间默认</option><option value="tag">标签优先</option></select>
                        </div>
                    )}

                    {!searchTerm && (
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition shadow-sm dark:shadow-none"><ChevronLeft size={18}/></button>
                            <input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} className="bg-transparent border-none font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer px-2 text-sm [color-scheme:light] dark:[color-scheme:dark]" />
                            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition shadow-sm dark:shadow-none"><ChevronRight size={18}/></button>
                            {currentDate !== todayStr && (
                            <button onClick={() => setCurrentDate(todayStr)} className="ml-1 p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" title="回到今天"><RotateCcw size={16}/></button>
                            )}
                        </div>
                    )}

                    {!isViewingPast && !searchTerm && (
                    <div className="flex items-center gap-2 shrink-0">
                        <button 
                            onClick={handleDeleteTodayPlans} 
                            title={`清空 ${currentDate} 的所有计划`} 
                            className="bg-red-50 hover:bg-red-100 text-red-500 p-2.5 rounded-xl font-bold flex items-center justify-center border border-red-100 dark:border-red-800/50 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-all active:scale-95"
                        >
                            <Trash2 size={20}/>
                        </button>
                        
                        <button onClick={() => setIsScheduleModalOpen(true)} title="导入课表 (.csv, .xls)" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95">
                            <FileSpreadsheet size={20}/>
                        </button>
                        <button onClick={handleAIDailySchedule} title="AI 智能排期 (一键安排当天任务时间)" className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95">
                            <Wand2 size={20}/>
                        </button>
                        <button onClick={() => { setEditingPlan(null); setNewAttachments([]); setTemplatePage(1); setPreSelectedEventId(null); setIsModalOpen(true); }} title="新增单日计划" className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                            <Plus size={20}/>
                        </button>
                    </div>
                    )}
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)))} className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition shadow-sm dark:shadow-none"><ChevronLeft size={18}/></button>
                        <span className="font-bold text-slate-600 dark:text-slate-300 px-3 text-sm min-w-[100px] text-center">
                            {currentCalendarDate.getFullYear()}年 {currentCalendarDate.getMonth() + 1}月
                        </span>
                        <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)))} className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition shadow-sm dark:shadow-none"><ChevronRight size={18}/></button>
                        <button onClick={() => setCurrentCalendarDate(new Date())} className="ml-1 p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors" title="回到本月"><RotateCcw size={16}/></button>
                    </div>
                    <button onClick={() => { setEditingEvent(null); setIsEventModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 shrink-0">
                        <Plus size={18}/> <span className="hidden sm:inline">跨日任务</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative flex flex-col">
        {viewMode === 'list' && (
            <div className="overflow-auto absolute inset-0 p-6 custom-scrollbar">
                {yesterdaySummaryData && !searchTerm && (
                    <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/50 relative overflow-hidden animate-in fade-in slide-in-from-top-4">
                        <Sparkles className="absolute right-0 top-0 text-indigo-200 dark:text-indigo-800/30 opacity-20 dark:opacity-40 -mr-4 -mt-4" size={100} />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
                                        <LayoutTemplate size={20}/> 昨日总结 ({yesterdaySummaryData.date})
                                    </h3>
                                    {taskSummaries[yesterdaySummaryData.date] && (
                                        <button 
                                            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                            className="p-1 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-full text-indigo-500 dark:text-indigo-400 shadow-sm transition-colors ml-2"
                                            title={isSummaryExpanded ? "收起总结" : "展开总结"}
                                        >
                                            {isSummaryExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                        </button>
                                    )}
                                </div>
                                {isGeneratingSummary && (
                                    <span className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1 font-bold">
                                        <Loader2 size={14} className="animate-spin" /> AI正在思考中...
                                    </span>
                                )}
                            </div>
                            
                            {isSummaryExpanded && taskSummaries[yesterdaySummaryData.date] && (
                                <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 shadow-sm text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed animate-in fade-in slide-in-from-top-2">
                                    <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                                        <Sparkles size={16}/> AI 教练点评：
                                    </div>
                                    {taskSummaries[yesterdaySummaryData.date]?.replace(/\*\*/g, '').replace(/### /g, '').replace(/## /g, '').replace(/# /g, '')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {visiblePlans.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 min-h-[300px]">
                    {searchTerm ? <Search size={64} className="mb-4 opacity-10"/> : <Calendar size={64} className="mb-4 opacity-10"/>}
                    <p>{searchTerm ? '没有找到相关计划' : (isViewingPast ? '这天没有记录计划' : '今天还没有安排计划')}</p>
                </div>
                ) : (
                    <>
                    {searchTerm && <div className="mb-4 text-xs text-slate-400 dark:text-slate-500 font-bold">搜索结果: {visiblePlans.length} 条</div>}
                    <div className="grid gap-4">
                    {visiblePlans.map(plan => {
                        const isCompleted = plan.status === 'completed';
                        const isPlanFromPast = plan.date < todayStr;
                        const canEditOrDelete = !isCompleted && !isPlanFromPast;

                        return (
                        <div key={plan.id} className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all ${isCompleted ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/50 opacity-90' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md'}`}>
                        <button 
                            onClick={() => initiateCompletion(plan)} 
                            disabled={isCompleted || plan.date !== todayStr}
                            className={`mt-1 shrink-0 transition-colors ${
                            isCompleted ? 'text-indigo-500 dark:text-indigo-400 cursor-not-allowed' : 
                            (plan.date !== todayStr ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-300 dark:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-300')
                            }`}
                        >
                            {isCompleted ? <CheckCircle2 size={24} className="fill-indigo-50 dark:fill-indigo-900/30"/> : <Circle size={24}/>}
                        </button>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {searchTerm && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{plan.date}</span>}
                                <div className={`font-mono font-bold text-sm whitespace-nowrap ${isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-indigo-600 dark:text-indigo-400'}`}>{plan.start} - {plan.end}</div>
                                
                                {plan.relatedEventTitle && (
                                  <div className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/50 font-medium ml-2">
                                    <LinkIcon size={10} />
                                    <span className="truncate max-w-[100px]">{plan.relatedEventTitle}</span>
                                  </div>
                                )}
                            </div>
                            <div className={`font-bold text-base mb-2 break-words ${isCompleted ? 'text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-800 dark:text-slate-200'}`}>{plan.content}</div>
                            
                            {isCompleted && plan.reflection && (
                                <div className="mb-3 bg-yellow-50/50 dark:bg-yellow-900/10 p-2.5 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                                    <MessageSquare size={14} className="text-yellow-500 dark:text-yellow-600 shrink-0 mt-0.5"/>
                                    <div className="italic">"{plan.reflection}"</div>
                                </div>
                            )}

                            {plan.attachments && plan.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {plan.attachments.map((att, idx) => (
                                <AttachmentItem key={idx} att={att} isCompact={true}/>
                                ))}
                            </div>
                            )}

                            {/* 展示子任务检查单 */}
                            {plan.checklist && plan.checklist.length > 0 && (
                                <div className="mt-2 mb-4 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-2 font-bold">
                                        <span className="flex items-center gap-1"><CheckCircle2 size={12}/> 进度: {plan.checklist.filter(c => c.completed).length}/{plan.checklist.length}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                        <div 
                                            className="h-full bg-indigo-500 dark:bg-indigo-400 transition-all duration-300" 
                                            style={{ width: `${(plan.checklist.filter(c => c.completed).length / plan.checklist.length) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="space-y-2">
                                        {plan.checklist.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 text-xs group/item">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleChecklistItem(plan.id, item.id); }}
                                                    className={`shrink-0 ${item.completed ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-300'} transition-colors`}
                                                    disabled={isCompleted}
                                                >
                                                    {item.completed ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
                                                </button>
                                                <span className={`${item.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 font-medium">{plan.module} · {plan.sub || '常规'}</span>
                            {plan.tag !== '无' && <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getTagStyle(plan.tag)}`}>{plan.tag}</span>}
                            </div>
                        </div>
                        
                        {canEditOrDelete && (
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingPlan(plan); setNewAttachments([]); setPreSelectedEventId(plan.relatedEventId); setIsModalOpen(true); }} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"><Edit2 size={16}/></button>
                            <button onClick={() => deletePlan(plan.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                        )}
                        </div>
                    )})}
                    </div>
                    </>
                )}
            </div>
        )}

        {viewMode === 'daily_gantt' && renderDailyGantt()}

        {viewMode === 'calendar' && (
            <div className="flex flex-col h-full animate-in fade-in">
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => (
                        <div key={i} className={`p-3 text-center text-xs font-bold ${i>=5?'text-indigo-400 dark:text-indigo-500':'text-slate-500 dark:text-slate-400'}`}>{day}</div>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {renderCalendar()}
                    </div>
                    <div className="p-4 text-center text-xs text-slate-300 dark:text-slate-600">
                        提示：点击日期格子可直接添加跨日任务，点击任务条可编辑。
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'project_gantt' && renderProjectGantt()}
      </div>

      {/* 反思弹窗 */}
      {reflectingPlan && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 relative border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setReflectingPlan(null)}
                className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors"
                title="取消"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center text-center mb-5 mt-2">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-3">
                      <Sparkles size={24}/>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">任务已完成！</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">"{reflectingPlan.content}"</p>
              </div>

              <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase">需要记录当下的反思或总结吗？</label>
                  <textarea 
                    autoFocus
                    rows="4" 
                    placeholder="例如：效率很高，或是遇到了什么困难..." 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 outline-none resize-none dark:text-slate-200"
                    value={reflectionText}
                    onChange={e => setReflectionText(e.target.value)}
                  />
              </div>

              <div className="flex gap-3">
                  <button 
                    onClick={skipReflection} 
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    暂不反思
                  </button>
                  <button 
                    onClick={confirmReflection} 
                    disabled={!reflectionText.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认并保存
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* 新增/编辑任务弹窗 (单日计划) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingPlan && editingPlan.id ? '编辑计划' : '新增计划'}</h3>
              <div className="flex items-center gap-2">
                 {(!editingPlan || !editingPlan.id) && (
                    <button type="button" onClick={() => setIsModuleMgrOpen(true)} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1">
                        <LayoutTemplate size={14}/> 常用模板
                    </button>
                 )}
                 <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full"><X size={20}/></button>
              </div>
            </div>

            {/* 关联跨日任务选择区域 */}
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-50 dark:border-indigo-900/50">
                <label className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                   <LinkIcon size={12}/> 关联跨日任务 (可选)
                </label>
                <select 
                  name="relatedEventId" 
                  defaultValue={editingPlan?.relatedEventId || preSelectedEventId || ""} 
                  className="w-full border border-indigo-100 dark:border-indigo-800/50 p-2 rounded-lg outline-none bg-white dark:bg-slate-800 text-sm dark:text-slate-200"
                >
                  <option value="">不关联任何跨日任务</option>
                  {calendarEvents
                    .filter(ev => {
                       const targetDate = editingPlan?.date || currentDate;
                       return targetDate >= ev.startDate && targetDate <= ev.endDate;
                    })
                    .map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))
                  }
                </select>
                <p className="text-[10px] text-indigo-400 dark:text-indigo-500 mt-1">
                  * 仅显示当前日期 ({editingPlan?.date || currentDate}) 正在进行中的跨日任务
                </p>
            </div>

            {/* 允许修改计划日期 */}
            <div className="mt-4">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><CalendarRange size={12}/> 计划日期</label>
              <input 
                name="planDate" 
                required 
                type="date" 
                defaultValue={editingPlan?.date || currentDate} 
                key={editingPlan?.date || currentDate}
                min={todayStr} 
                disabled={editingPlan && (editingPlan.status === 'completed' || editingPlan.date < todayStr)}
                className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all bg-slate-50 dark:bg-slate-800 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-60" 
              />
            </div>

            {/* 周期性规则选择 */}
            {(!editingPlan || !editingPlan.id) && (
                <div className="bg-orange-50/50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-50 dark:border-orange-900/50 mt-4">
                    <label className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1">
                        <CalendarRange size={12}/> 周期性重复 (可选)
                    </label>
                    <div className="flex gap-3">
                        <select 
                            value={repeatRule} 
                            onChange={e => setRepeatRule(e.target.value)}
                            className="flex-1 border border-orange-100 dark:border-orange-800/50 p-2 rounded-lg outline-none bg-white dark:bg-slate-800 text-sm dark:text-slate-200"
                        >
                            <option value="none">不重复 (仅当天)</option>
                            <option value="daily">每天重复</option>
                            <option value="workday">工作日重复 (一至五)</option>
                            <option value="weekly">每周重复 (同今天)</option>
                        </select>
                        
                        {repeatRule !== 'none' && (
                            <input 
                                type="date" 
                                value={repeatEndDate} 
                                onChange={e => setRepeatEndDate(e.target.value)}
                                min={todayStr}
                                className="flex-1 border border-orange-100 dark:border-orange-800/50 p-2 rounded-lg outline-none bg-white dark:bg-slate-800 text-sm [color-scheme:light] dark:[color-scheme:dark] dark:text-slate-200"
                            />
                        )}
                    </div>
                </div>
            )}

            {(!editingPlan || !editingPlan.id) && modules.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mt-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Copy size={10}/> 快速载入 ({modules.length})
                        </div>
                        {Math.ceil(modules.length / 3) > 1 && (
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-1 py-0.5">
                                <button type="button" onClick={() => setTemplatePage(p => Math.max(1, p - 1))} disabled={templatePage === 1} className="p-0.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 rounded"><ChevronLeft size={12}/></button>
                                <span className="text-[10px] text-slate-400 font-mono w-6 text-center">{templatePage}/{Math.ceil(modules.length / 3)}</span>
                                <button type="button" onClick={() => setTemplatePage(p => Math.min(Math.ceil(modules.length / 3), p + 1))} disabled={templatePage === Math.ceil(modules.length / 3)} className="p-0.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 rounded"><ChevronRight size={12}/></button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {modules.slice((templatePage - 1) * 3, templatePage * 3).map(m => (
                            <button key={m.id} type="button" onClick={() => applyTemplate(m)} className="w-full text-left p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-sm transition-all group flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                            m.module === '工作' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : m.module === '学习' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : m.module === '运动' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>{m.module}</span>
                                        {m.sub && <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700">{m.sub}</span>}
                                    </div>
                                    <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">{m.start}-{m.end}</span>
                                </div>
                                <div className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate w-full pl-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{m.content || '无详情'}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><Clock size={12}/> 开始时间</label><input name="start" required type="time" defaultValue={editingPlan?.start || '09:00'} key={editingPlan?.start} className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all bg-slate-50 dark:bg-slate-800 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]" /></div>
              <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><Clock size={12}/> 结束时间</label><input name="end" required type="time" defaultValue={editingPlan?.end || '10:00'} key={editingPlan?.end} className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all bg-slate-50 dark:bg-slate-800 dark:text-slate-200 [color-scheme:light] dark:[color-scheme:dark]" /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><Layers size={12}/> 模块</label>
                  <select name="module" defaultValue={editingPlan?.module || '学习'} key={editingPlan?.module} className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 dark:text-slate-200 appearance-none">
                    <option>工作</option><option>学习</option><option>生活</option><option>运动</option><option>其他</option>
                  </select>
               </div>
               <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><Tag size={12}/> 子分类</label><input name="sub" placeholder="如: Java" defaultValue={editingPlan?.sub} key={editingPlan?.sub} className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 dark:text-slate-200" /></div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><AlignLeft size={12}/> 内容详情</label>
                <textarea name="content" required rows="3" placeholder="具体要做什么..." defaultValue={editingPlan?.content} key={editingPlan?.content} className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all bg-slate-50 dark:bg-slate-800 dark:text-slate-200 resize-none" />
            </div>

            {/* 子任务检查单 */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mt-4">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 size={12}/> 子任务拆解 (Checklist)
                </label>
                <div className="space-y-2">
                    {editingChecklist.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center gap-2 group">
                            <button 
                                type="button" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setEditingChecklist(prev => prev.map((c, i) => 
                                        i === idx ? { ...c, completed: !c.completed } : c
                                    ));
                                }}
                                className={`shrink-0 ${item.completed ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600 hover:text-indigo-400 dark:hover:text-indigo-300'} transition-colors`}
                            >
                                {item.completed ? <CheckCircle2 size={16}/> : <Circle size={16}/>}
                            </button>
                            <input 
                                type="text" 
                                value={item.text} 
                                onChange={(e) => {
                                    const newText = e.target.value;
                                    setEditingChecklist(prev => prev.map((c, i) => 
                                        i === idx ? { ...c, text: newText } : c
                                    ));
                                }}
                                className={`flex-1 bg-transparent border-b border-transparent focus:border-indigo-300 dark:focus:border-indigo-500/50 outline-none text-sm transition-all ${item.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}
                            />
                            <button 
                                type="button" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setEditingChecklist(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14}/>
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 mt-1">
                        <Plus size={16} className="text-slate-400 dark:text-slate-500 shrink-0"/>
                        <input 
                            type="text" 
                            placeholder="添加小步骤... (按回车快速添加)" 
                            value={newChecklistItem}
                            onChange={e => setNewChecklistItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (newChecklistItem.trim()) {
                                        setEditingChecklist(prev => [...prev, { id: Date.now().toString() + Math.random(), text: newChecklistItem.trim(), completed: false }]);
                                        setNewChecklistItem('');
                                    }
                                }
                            }}
                            className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                if (newChecklistItem.trim()) {
                                    setEditingChecklist(prev => [...prev, { id: Date.now().toString() + Math.random(), text: newChecklistItem.trim(), completed: false }]);
                                    setNewChecklistItem('');
                                }
                            }}
                            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-1 rounded font-bold hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors"
                        >
                            添加
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><Tag size={12}/> 标签</label>
                  <select name="tag" defaultValue={editingPlan?.tag || '无'} key={editingPlan?.tag} className="w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl outline-none bg-slate-50 dark:bg-slate-800 dark:text-slate-200">
                    <option>无</option><option>紧急</option><option>重要</option><option>休闲</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><Paperclip size={12}/> 附件 (可多选)</label>
                  <div className="relative group">
                    <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="*" disabled={isSaving}/>
                    <div className={`w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex items-center gap-2 transition-colors ${isSaving ? 'opacity-50' : 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:border-indigo-200 dark:group-hover:border-indigo-800/50'}`}>
                       {isSaving ? <Loader2 size={14} className="animate-spin text-indigo-500 dark:text-indigo-400"/> : <Paperclip size={14} className="text-indigo-500 dark:text-indigo-400"/>}
                       <span className="truncate text-slate-500 dark:text-slate-400">{isSaving ? '正在上传...' : '点击添加附件'}</span>
                    </div>
                  </div>
                </div>
            </div>
            
            {(editingPlan?.attachments?.length > 0 || newAttachments.length > 0) && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2 mt-4">
                 {editingPlan?.attachments?.map((att) => (
                    <AttachmentItem key={att.id || att.url} att={att} onDelete={() => handleRemoveAttachment(att.id, false)} />
                 ))}
                 {newAttachments.map((att) => (
                    <AttachmentItem key={att.id} att={att} onDelete={() => handleRemoveAttachment(att.id, true)} />
                 ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">取消</button>
              <button type="submit" disabled={isSaving} className="px-8 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 disabled:bg-indigo-300 dark:disabled:bg-indigo-800">{isSaving ? '处理中...' : '保存计划'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}