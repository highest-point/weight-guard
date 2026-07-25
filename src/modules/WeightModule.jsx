import React, { useState, useEffect } from 'react';
import { 
  Activity, Utensils, Scale, TrendingUp, ChevronRight, Plus, AlertCircle, CheckCircle2,
  Dumbbell, ArrowLeft, Search, Loader2, Sparkles, Trash2, Sun, Moon, Target, 
  X, Flame, BrainCircuit, AlertTriangle, LayoutDashboard, ArrowRight, Save, Calendar, Edit, Settings, Camera,
  Globe, Info, Search as SearchIcon, RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, ComposedChart
} from 'recharts';
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db, APP_ID } from '../config/firebase';
import { VOLCENGINE_API_KEY, VOLCENGINE_ENDPOINT, AI_KNOWLEDGE_BASE, EXERCISE_CALORIE_LOOKUP, INITIAL_FOOD_DB, DEFAULT_EXERCISE_DB } from '../constants';
import { callVolcengineText, callVolcengineVision, fileToBase64, calculateBMR, calculateBMI, getTodayDate, getFutureDate, getMondayDate, getPlanStatus } from '../utils';

const ProgressBar = ({ current, target, color = "bg-blue-500", label }) => {
  const percent = Math.min(100, Math.max(0, (current / target) * 100));
  if (isNaN(percent)) return null;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1 text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <span>{Math.round(current || 0)} / {Math.round(target || 0)}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

// ==========================================
// 2. 弹窗组件区域
// ==========================================

const PreferencesManagerModal = ({ isOpen, onClose, currentPreferences, onSave }) => {
  const [prefs, setPrefs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [editName, setEditName] = useState('');
  const [editFreq, setEditFreq] = useState('weekly'); 
  const [editLimit, setEditLimit] = useState(3);
  const [searchResult, setSearchResult] = useState(null); 
  const [isSearching, setIsSearching] = useState(false); 

  useEffect(() => {
    if (isOpen) {
      setPrefs(currentPreferences || []);
      resetForm();
    }
  }, [isOpen, currentPreferences]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setEditName('');
    setEditFreq('weekly');
    setEditLimit(3);
    setSearchResult(null);
  };

  const handleSearch = async () => {
    if (!editName) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
        const prompt = `请提供1份【${editName}】的营养数据，严格返回JSON格式：{"cal": 热量(整数数字), "p": 蛋白质克数(整数数字), "c": 碳水克数(整数数字), "f": 脂肪克数(整数数字), "unit": "推荐单位(如:杯/份/个/100g)", "warning": "简短的一句健康提示"}`;
        const result = await callVolcengineText(prompt);
        setSearchResult({ ...result, name: editName });
    } catch (e) {
        console.error("API 搜索失败:", e);
        let found = Object.entries(AI_KNOWLEDGE_BASE).find(([k]) => editName.includes(k));
        const info = found ? found[1] : { cal: 200, p: 5, c: 20, f: 10, category: 'snack', unit: '份', name: editName, warning: '暂无数据' };
        setSearchResult(info);
    } finally {
        setIsSearching(false);
    }
  };

  const handleEditClick = (pref) => {
    setIsEditing(true);
    setEditingId(pref.id);
    setEditName(pref.name);
    setEditFreq(pref.rule?.type || 'weekly');
    setEditLimit(pref.rule?.limit || 3);
    setSearchResult(pref.info);
  };

  const handleSaveItem = () => {
    if (!editName || !searchResult) return;
    const newItem = {
      id: editingId || Date.now().toString(),
      name: editName,
      info: searchResult,
      rule: { type: editFreq, limit: Number(editLimit) },
      stats: editingId 
        ? (prefs.find(p => p.id === editingId)?.stats || { count: 0, weekStart: getMondayDate() })
        : { count: 0, weekStart: getMondayDate() }
    };
    let newPrefs;
    if (editingId) {
      newPrefs = prefs.map(p => p.id === editingId ? newItem : p);
    } else {
      newPrefs = [...prefs, newItem];
    }
    setPrefs(newPrefs);
    resetForm();
  };

  const handleDelete = (id) => {
    if(window.confirm("确定删除这个偏好吗？")) {
      setPrefs(prefs.filter(p => p.id !== id));
    }
  };

  const handleSaveAll = () => {
    onSave(prefs);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Settings size={18}/> 管理饮食偏好</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {isEditing ? (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 mb-6 animate-in fade-in">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-3 uppercase">{editingId ? '修改偏好' : '新增偏好'}</h4>
              <div className="flex gap-2 mb-3">
                <input className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:bg-slate-800 dark:text-slate-200" placeholder="输入食物名称 (如: 奶茶)" value={editName} onChange={e => setEditName(e.target.value)} />
                <button onClick={handleSearch} disabled={isSearching} className="bg-indigo-500 text-white px-3 rounded-lg text-xs font-bold flex items-center gap-1 disabled:bg-indigo-300 dark:disabled:bg-indigo-700">
                  {isSearching ? <Loader2 size={14} className="animate-spin"/> : null} 搜索数据
                </button>
              </div>
              
              {searchResult && (
                <div className="space-y-3">
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 bg-white/50 dark:bg-slate-800/50 p-2 rounded border border-indigo-100 dark:border-indigo-800/50 flex justify-between">
                    <span>🔥 {searchResult.cal} kcal/{searchResult.unit}</span>
                    <span>{searchResult.warning || '无备注'}</span>
                  </div>
                  <div className="flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">允许频率:</label>
                    <select className="p-1 border border-slate-200 dark:border-slate-700 rounded text-xs bg-slate-50 dark:bg-slate-900 outline-none dark:text-slate-200" value={editFreq} onChange={e => setEditFreq(e.target.value)}>
                      <option value="daily">每天</option>
                      <option value="weekly">每周</option>
                    </select>
                    <span className="text-xs text-slate-500 dark:text-slate-400">限</span>
                    <input type="number" className="w-12 p-1 border border-slate-200 dark:border-slate-700 rounded text-center text-xs font-bold outline-none dark:bg-slate-900 dark:text-slate-200" value={editLimit} onChange={e => setEditLimit(e.target.value)} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">次</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={resetForm} className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700">取消</button>
                    <button onClick={handleSaveItem} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">确认保存</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => { setIsEditing(true); setEditName(''); setSearchResult(null); }} className="w-full py-3 mb-6 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <Plus size={18}/> 添加新偏好
            </button>
          )}

          <div className="space-y-3">
            {prefs.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
                <div className="flex-1">
                  <div className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    {p.name} 
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.rule?.type === 'weekly' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {p.rule?.type === 'weekly' ? '周' : '日'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    上限 {p.rule?.limit || '-'} 次 · 已吃 <span className="font-bold text-indigo-500 dark:text-indigo-400">{p.stats?.count || 0}</span> 次
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditClick(p)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {prefs.length === 0 && !isEditing && <div className="text-center text-slate-300 dark:text-slate-600 text-xs">还没有设置偏好，点击上方添加</div>}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button onClick={handleSaveAll} className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-lg dark:shadow-none">完成并保存</button>
        </div>
      </div>
    </div>
  );
};

const BMIConfirmModal = ({ isOpen, bmi, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-xl p-6 animate-in zoom-in-95">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-3"><AlertTriangle size={24} /></div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">BMI 偏低提醒</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">目标 BMI 为 <span className="font-bold text-amber-600 dark:text-amber-500">{bmi}</span>，属于偏瘦范围。确认继续吗？</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700">返回</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600">继续</button>
        </div>
      </div>
    </div>
  );
};

const SmartSearchModal = ({ isOpen, onClose, isSearching, result, onApply, onManualSearch }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="absolute inset-0 z-0" onClick={onClose}></div>
        <div className="relative z-10 bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center">
          {isSearching ? (
            <>
              <div className="w-16 h-16 mb-4 relative">
                 <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                 <Sparkles className="absolute inset-0 m-auto text-indigo-500 dark:text-indigo-400 animate-pulse" size={20}/>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">正在智能分析...</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">请求大模型解析运动热量</p>
            </>
          ) : result ? (
            <>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 size={24}/>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">识别成功</h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 w-full mb-4">
                 <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">大模型匹配结果</div>
                 <div className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{result.name}</div>
                 <div className="font-mono text-slate-600 dark:text-slate-300 font-bold">{result.kcal} kcal / 30分</div>
              </div>
              <button onClick={onApply} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                采用此数据
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-3">
                <AlertCircle size={24}/>
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1">自动提取失败</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-2">
                模型未能识别或网络超时。
              </p>
              <button onClick={onManualSearch} className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors mb-2 flex items-center justify-center gap-2">
                <Globe size={16}/> 去百度搜索
              </button>
              <button onClick={onClose} className="text-xs text-slate-400 dark:text-slate-500 underline hover:text-slate-600 dark:hover:text-slate-300">
                返回手动输入
              </button>
            </>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400"><X size={20}/></button>
        </div>
      </div>
    </div>
  );
};

const ExerciseEditModal = ({ isOpen, onClose, exercise, onSave }) => {
  const [form, setForm] = useState({ name: '', kcal30: '' });
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (exercise) {
        setForm({ name: exercise.name, kcal30: Math.round(exercise.calPerMin * 30) });
        setIsAutoFilled(true);
      } else {
        setForm({ name: '', kcal30: '' });
        setIsAutoFilled(false);
      }
    }
  }, [isOpen, exercise]);

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm({ ...form, name });
    if (isAutoFilled) setIsAutoFilled(false);
  };

  const handleSmartSearch = async () => {
    if (!form.name) return alert("请先输入运动名称");
    
    setShowSearchModal(true);
    setIsSearching(true);
    setSearchResult(null);

    try {
        const prompt = `请提供【${form.name}】运动30分钟大概消耗的热量(大卡)。严格返回JSON格式：{"kcal": 热量(整数数字)}`;
        const result = await callVolcengineText(prompt);
        if (result && result.kcal) {
            setSearchResult({ name: form.name, kcal: result.kcal });
        } else {
            setSearchResult(null);
        }
    } catch (err) {
        console.error("API 运动搜索失败:", err);
        let foundName = null;
        let foundKcal = null;
        for (const key in EXERCISE_CALORIE_LOOKUP) {
            if (form.name.includes(key) || key.includes(form.name)) {
                foundName = key;
                foundKcal = EXERCISE_CALORIE_LOOKUP[key];
                break;
            }
        }
        if (foundKcal) {
            setSearchResult({ name: foundName, kcal: foundKcal });
        } else {
            setSearchResult(null);
        }
    } finally {
        setIsSearching(false);
    }
  };

  const applySearchResult = () => {
    if (searchResult) {
      setForm({ name: searchResult.name, kcal30: searchResult.kcal });
      setIsAutoFilled(true);
      setShowSearchModal(false);
    }
  };

  const handleManualBaiduSearch = () => {
    const query = `${form.name} 30分钟 消耗热量`;
    window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}`, '_blank');
    setShowSearchModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.kcal30) return alert("请完整填写信息");
    onSave({
      id: exercise?.id,
      name: form.name,
      calPerMin: parseFloat((form.kcal30 / 30).toFixed(1)),
      type: 'custom',
      intensity: '自定义'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <SmartSearchModal 
        isOpen={showSearchModal} 
        onClose={() => setShowSearchModal(false)}
        isSearching={isSearching}
        result={searchResult}
        onApply={applySearchResult}
        onManualSearch={handleManualBaiduSearch}
      />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-800 dark:text-slate-100">{exercise ? '编辑运动' : '添加运动'}</h3>
             <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">运动名称</label>
                <div className="flex gap-2">
                   <input required value={form.name} onChange={handleNameChange} placeholder="如: 足球" className="flex-1 p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 dark:text-slate-200"/>
                   <button type="button" onClick={handleSmartSearch} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors" title="AI智能识别">
                     <SearchIcon size={14}/> 搜索
                   </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{isAutoFilled ? <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1"><Sparkles size={10}/> 已应用大模型数据</span> : "输入名称后点击搜索智能获取热量"}</p>
             </div>
             <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">消耗热量 (kcal / 30分钟)</label>
                <input type="number" required value={form.kcal30} onChange={e => { setForm({...form, kcal30: e.target.value}); setIsAutoFilled(false); }} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-teal-500 font-bold text-teal-600 dark:text-teal-400" placeholder="例如: 300"/>
             </div>
             <button type="submit" className="w-full py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 dark:shadow-none hover:bg-teal-700 transition-colors">保存设置</button>
          </form>
        </div>
      </div>
    </>
  );
};

// ==========================================
// 3. 主模块组件
// ==========================================

export default function WeightModule({ user }) {
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);

  // 数据状态
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  
  // 详情页状态
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dailyLog, setDailyLog] = useState({
    date: getTodayDate(), consumed: 0, burned: 0, water: 0, weightMorning: '', weightEvening: '', meals: [], exercises: [], warnings: [], treatCount: {}, aiSummary: '' 
  });
  const [history, setHistory] = useState([]);
  const [foodDB] = useState(INITIAL_FOOD_DB);
  
  // 运动模块状态
  const [exerciseModules, setExerciseModules] = useState([]);
  const [showExEditModal, setShowExEditModal] = useState(false);
  const [editingExerciseModule, setEditingExerciseModule] = useState(null);

  // 趋势图 hover 状态
  const [hoveredChartData, setHoveredChartData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false); 

  // UI 交互状态
  const [activeMealEditor, setActiveMealEditor] = useState(null);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodCal, setCustomFoodCal] = useState('');
  const [foodPortion, setFoodPortion] = useState(1);
  const [isAddingExercise, setIsAddingExercise] = useState(null);
  const [exerciseDurationInput, setExerciseDurationInput] = useState('30');
  
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false); // AI 生成计划状态

  const [showPrefModal, setShowPrefModal] = useState(false); 
  const [isRecognizing, setIsRecognizing] = useState(false); // 体重秤 OCR 状态
  const [isRecognizingFood, setIsRecognizingFood] = useState(false); // 食物 OCR 状态
  const [isSearchingFood, setIsSearchingFood] = useState(false); // 搜索食物热量

  // 表单状态
  const [formData, setFormData] = useState({
    name: '', height: 165, currentWeight: 60, targetWeight: 55, age: 25, gender: 'female', 
    activityLevel: 1.2, goal: 'loss', startDate: getTodayDate(), endDate: getFutureDate(8)
  });
  const [generatedResult, setGeneratedResult] = useState(null);
  const [showBMIConfirm, setShowBMIConfirm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [customPreferences, setCustomPreferences] = useState([]);

  useEffect(() => {
    if (!user) return;
    const plansRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'weight_plans');
    const exRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'exercise_modules'); 

    const unsubscribePlans = onSnapshot(plansRef, (snap) => {
      if (snap.exists()) {
        const list = snap.data().list || [];
        list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setPlans(list);
      }
      setLoading(false);
    });

    const unsubscribeEx = onSnapshot(exRef, (snap) => {
      if (snap.exists()) {
        setExerciseModules(snap.data().list || []);
      } else {
        setExerciseModules(DEFAULT_EXERCISE_DB);
        setDoc(exRef, { list: DEFAULT_EXERCISE_DB }); 
      }
    });

    return () => { unsubscribePlans(); unsubscribeEx(); };
  }, [user]);
  
  const savePlansToCloud = async (newPlans) => { 
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'weight_plans'), { list: newPlans }, { merge: true }); 
  };
  
  const saveLog = async (newLog) => { 
    try { 
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${activePlan.id}_log_${newLog.date}`), newLog); 
    } catch (e) { 
      console.error('Failed to save log:', e); 
    } 
  };
  
  const saveHistory = async (newHistory) => { 
    try { 
      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${activePlan.id}_history`), { records: newHistory }); 
    } catch (e) { 
      console.error('Failed to save history:', e); 
    } 
  };

  const calculatePlanDetails = async (data) => {
    const h = parseFloat(data.height);
    const w = parseFloat(data.currentWeight);
    const bmr = calculateBMR(data.gender, w, h, data.age);
    const tdee = bmr * parseFloat(data.activityLevel);
    
    // 计算总天数
    const days = Math.max(1, Math.ceil(Math.abs(new Date(data.endDate) - new Date(data.startDate)) / (86400000)));

    const prompt = `我需要制定一个减重计划。
个人信息：性别 ${data.gender === 'male' ? '男' : '女'}, 年龄 ${data.age}, 身高 ${h}cm, 初始体重 ${w}kg, 目标体重 ${data.targetWeight}kg。
代谢数据：基础代谢(BMR) ${Math.round(bmr)}kcal, 每日总消耗(TDEE) ${Math.round(tdee)}kcal。
计划时间：共 ${days} 天。
请根据我的情况，为我生成一个科学的减重方案，并严格按照以下JSON格式返回（不要输出任何Markdown标记符和其他文字）：
{
  "dailyCal": 建议每日摄入热量(整数, 女性建议不低于1200, 男性不低于1400),
  "macros": { "p": 蛋白质克数(整数), "c": 碳水克数(整数), "f": 脂肪克数(整数) },
  "dietAdvice": "一段50字左右的具体饮食建议",
  "dailyTrend": [这是一个预期体重数字的数组，共 ${days + 1} 个数字。第一个数字必须是 ${w}，最后一个数字必须是 ${data.targetWeight}。请设计一个符合人体减重规律的递减曲线，比如前期因水分流失掉秤稍快，后期平缓下降]
}`;

    let aiResult;
    try {
        aiResult = await callVolcengineText(prompt);
    } catch (error) {
        console.error("AI 生成计划失败，降级使用默认算法:", error);
        let dailyCal = tdee;
        if (data.goal === 'loss') {
            const diff = w - parseFloat(data.targetWeight);
            const deficit = (diff * 7700) / days;
            dailyCal = Math.max(tdee - deficit, data.gender === 'female' ? 1200 : 1400);
        }
        const dailyLoss = (w - parseFloat(data.targetWeight)) / days;
        const fallbackTrend = [];
        for (let i = 0; i <= days; i++) {
            fallbackTrend.push(parseFloat((w - dailyLoss * i).toFixed(2)));
        }
        aiResult = {
            dailyCal: Math.round(dailyCal),
            macros: { p: Math.round((dailyCal * 0.3) / 4), c: Math.round((dailyCal * 0.45) / 4), f: Math.round((dailyCal * 0.25) / 9) },
            dietAdvice: dailyCal < 1200 ? "热量偏低，注意补充高质蛋白。" : "推荐均衡饮食，保证蔬菜摄入。",
            dailyTrend: fallbackTrend
        };
    }

    return {
      id: Date.now().toString(),
      createDate: getTodayDate(),
      ...data,
      customPreferences,
      bmr: Math.round(bmr), 
      tdee: Math.round(tdee), 
      dailyCal: aiResult.dailyCal,
      macros: aiResult.macros,
      dietAdvice: aiResult.dietAdvice,
      dailyTrend: aiResult.dailyTrend,
      status: 'active'
    };
  };

  const handleGeneratePlan = async (e) => {
    if(e) e.preventDefault();
    if (formData.goal === 'loss' && Number(formData.targetWeight) >= Number(formData.currentWeight)) { alert("目标体重必须小于起始体重"); return; }
    const targetBMI = calculateBMI(formData.targetWeight, formData.height);
    if (formData.goal === 'loss' && targetBMI < 18.5 && !showBMIConfirm) { setShowBMIConfirm(true); return; }
    setShowBMIConfirm(false);
    
    if (formData.endDate < formData.startDate) {
        alert("结束日期不能早于开始日期");
        return;
    }

    setIsGeneratingPlan(true);
    try {
        const result = await calculatePlanDetails(formData);
        setGeneratedResult(result);
        setView('result');
    } catch {
        alert("计划生成出错，请重试。");
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (formData.endDate < formData.startDate) {
        alert("结束日期不能早于开始日期");
        return;
    }
    
    setIsGeneratingPlan(true);
    try {
        const updatedDetails = await calculatePlanDetails(formData);
        const updatedPlan = { ...updatedDetails, id: editingPlanId, customPreferences: customPreferences }; 
        const newPlans = plans.map(p => p.id === editingPlanId ? updatedPlan : p);
        newPlans.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setPlans(newPlans);
        savePlansToCloud(newPlans);
        setView('list');
        setEditingPlanId(null);
    } catch {
        alert("计划更新出错，请重试。");
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const confirmSavePlan = async () => {
    const newPlans = [...plans, generatedResult];
    newPlans.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    setPlans(newPlans);
    await savePlansToCloud(newPlans);
    setFormData({ name: '', height: 165, currentWeight: 60, targetWeight: 55, age: 25, gender: 'female', activityLevel: 1.2, goal: 'loss', startDate: getTodayDate(), endDate: getFutureDate(8) });
    setCustomPreferences([]);
    setGeneratedResult(null);
    setView('list');
  };

  const deletePlan = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm("确定删除这个计划吗？")) return;
    const newPlans = plans.filter(p => p.id !== id);
    setPlans(newPlans);
    await savePlansToCloud(newPlans);
  };

  const startEditPlan = (e, plan) => {
    e.stopPropagation();
    setEditingPlanId(plan.id);
    setActivePlan(plan);
    setFormData({
        name: plan.name, height: plan.height, currentWeight: plan.currentWeight, targetWeight: plan.targetWeight,
        age: plan.age, gender: plan.gender, activityLevel: plan.activityLevel, goal: plan.goal || 'loss',
        startDate: plan.startDate, endDate: plan.endDate
    });
    setCustomPreferences(plan.customPreferences || []);
    setView('edit');
  };

  const handleUpdatePreferences = (newPrefs) => {
    if (view === 'create' || view === 'edit') {
        setCustomPreferences(newPrefs);
    } else if (activePlan) {
        const updatedPlan = { ...activePlan, customPreferences: newPrefs };
        const newPlans = plans.map(p => p.id === activePlan.id ? updatedPlan : p);
        setPlans(newPlans);
        setActivePlan(updatedPlan);
        savePlansToCloud(newPlans);
    }
  };

  const handleGenerateAIReport = async (dateStr) => {
    const targetDate = dateStr === '今天' ? getTodayDate() : dateStr; 
    
    setIsGeneratingReport(true);

    try {
        let logData = dailyLog;
        if (targetDate !== getTodayDate()) {
            const logSnap = await getDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${activePlan.id}_log_${targetDate}`));
            if (logSnap.exists()) {
                logData = logSnap.data();
            } else {
                logData = { weightMorning: '', weightEvening: '', consumed: 0, burned: 0, meals: [], exercises: [] };
            }
        }

        const morningWeight = logData.weightMorning || '未记录';
        const eveningWeight = logData.weightEvening || '未记录';
        const mealsInfo = (logData.meals || []).map(m => `${m.time}: ${m.name}(${m.cal}kcal)`).join('，') || '无';
        const exercisesInfo = (logData.exercises || []).map(e => `${e.name}(${e.duration}分，消耗${e.calories}kcal)`).join('，') || '无';
        
        const prompt = `请根据以下我在 ${targetDate} 的减重打卡数据进行分析：
1. 晨重：${morningWeight}kg，晚重：${eveningWeight}kg
2. 饮食记录：${mealsInfo} （总摄入：${logData.consumed || 0}kcal）
3. 运动记录：${exercisesInfo} （总消耗：${logData.burned || 0}kcal）

要求：
1. 分析晨晚重差异是否合理。
2. 评价饮食摄入情况和运动消耗情况。
3. 给出明天的一句话可行性建议。
请排版清晰，直接输出文字分析内容，不要使用Markdown代码块包裹。`;

        const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VOLCENGINE_API_KEY}`
            },
            body: JSON.stringify({
                model: VOLCENGINE_ENDPOINT, 
                messages: [
                    { role: 'system', content: '你是一位专业的减重和营养教练，你的回答需要客观、有科学依据并且具有激励性。' },
                    { role: 'user', content: prompt }
                ]
            })
        });
        
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            const aiText = data.choices[0].message.content;

            const updatedLog = { ...logData, aiSummary: aiText };
            await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${activePlan.id}_log_${targetDate}`), updatedLog, { merge: true });

            const idx = history.findIndex(h => h.date === targetDate);
            const record = idx >= 0 ? { ...history[idx], aiSummary: aiText } : { date: targetDate, aiSummary: aiText, weight: null, consumed: updatedLog.consumed, burned: updatedLog.burned };
            let newHist = idx >= 0 ? [...history] : [...history, record];
            if (idx >= 0) newHist[idx] = record;
            setHistory(newHist);
            await saveHistory(newHist);

            if (targetDate === getTodayDate()) {
                setDailyLog(prev => ({ ...prev, aiSummary: aiText }));
            }
        } else {
            alert('生成分析失败，请检查 API 配置。');
        }
    } catch (e) {
        console.error("AI 分析失败:", e);
        alert('请求失败，请检查网络或控制台报错。');
    } finally {
        setIsGeneratingReport(false);
    }
  };


  useEffect(() => {
    if (!user || view !== 'detail' || !activePlan) return;
    const todayStr = getTodayDate();
    
    const unsubLog = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${activePlan.id}_log_${todayStr}`), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setDailyLog({ ...d, meals: d.meals || [], exercises: d.exercises || [], warnings: d.warnings || [], treatCount: d.treatCount || {}, aiSummary: d.aiSummary || '' });
      } else {
        setDailyLog({ date: todayStr, consumed: 0, burned: 0, water: 0, weightMorning: '', weightEvening: '', meals: [], exercises: [], warnings: [], treatCount: {}, aiSummary: '' });
      }
    });

    const unsubHistory = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${activePlan.id}_history`), (snap) => {
      if (snap.exists()) setHistory(snap.data().records || []);
      else setHistory([]); 
    });

    return () => { unsubLog(); unsubHistory(); };
  }, [user, view, activePlan]);

  const syncHistoryFromLogs = async () => {
    if (!activePlan || !user || isSyncing) return;
    setIsSyncing(true);
    
    const [sYear, sMonth, sDay] = activePlan.startDate.split('-').map(Number);
    const startDateObj = new Date(sYear, sMonth - 1, sDay);
    const today = new Date();
    today.setHours(0,0,0,0);

    const newHistory = [...history];
    let hasUpdates = false;

    for (let d = new Date(startDateObj); d < today; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dStr = `${year}-${month}-${day}`;
        
        const existingIdx = newHistory.findIndex(h => h.date === dStr);
        if (existingIdx === -1) {
            try {
                const logRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', `plan_${activePlan.id}_log_${dStr}`);
                const logSnap = await getDoc(logRef);
                
                if (logSnap.exists()) {
                    const logData = logSnap.data();
                    const weight = logData.weightEvening || logData.weightMorning; 
                    
                    if (weight) {
                        const record = { 
                            date: dStr, 
                            weight: parseFloat(weight), 
                            consumed: logData.consumed || 0, 
                            burned: logData.burned || 0,
                            aiSummary: logData.aiSummary || null
                        };
                        newHistory.push(record);
                        hasUpdates = true;
                    }
                }
            } catch (err) {
                console.error("Sync error for date:", dStr, err);
            }
        }
    }

    if (hasUpdates) {
        newHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        setHistory(newHistory);
        await saveHistory(newHistory);
        alert("同步完成！历史数据已恢复。");
    } else {
        alert("同步完成，没有发现遗漏的历史数据。");
    }
    setIsSyncing(false);
  };

  const addFood = (food, mealTime) => {
    let newWarnings = [...(dailyLog.warnings || [])];
    let newTreatCount = { ...(dailyLog.treatCount || {}) };
    if (food.category === 'treat') {
      const count = (newTreatCount[food.name] || 0) + 1;
      if (count >= 1) newWarnings.push(`今日${food.name}已达标`);
      newTreatCount[food.name] = count;
    }
    const newLog = { ...dailyLog, consumed: dailyLog.consumed + food.cal, meals: [...dailyLog.meals, { ...food, time: mealTime }], warnings: newWarnings, treatCount: newTreatCount };
    setDailyLog(newLog);
    saveLog(newLog);
  };
  const removeMeal = (index) => {
    const meal = dailyLog.meals[index];
    const newLog = { ...dailyLog, consumed: dailyLog.consumed - meal.cal, meals: dailyLog.meals.filter((_, i) => i !== index) };
    setDailyLog(newLog);
    saveLog(newLog);
  };
  const addExercise = (ex, duration) => {
    const cal = Math.round(ex.calPerMin * duration);
    const newLog = { ...dailyLog, burned: dailyLog.burned + cal, exercises: [...dailyLog.exercises, { ...ex, duration: parseInt(duration), calories: cal }] };
    setDailyLog(newLog);
    saveLog(newLog);
  };
  const removeExercise = (index) => {
    const ex = dailyLog.exercises[index];
    const newLog = { ...dailyLog, burned: dailyLog.burned - ex.calories, exercises: dailyLog.exercises.filter((_, i) => i !== index) };
    setDailyLog(newLog);
    saveLog(newLog);
  };
  const handleWeightInput = (type, value) => { setDailyLog(prev => ({ ...prev, [type === 'morning' ? 'weightMorning' : 'weightEvening']: value })); };
  
  const handleWeightBlur = async (type) => {
    const valStr = type === 'morning' ? dailyLog.weightMorning : dailyLog.weightEvening;
    const val = parseFloat(valStr);
    if (isNaN(val) || !valStr) return;
    
    await saveLog(dailyLog); 
    
    const weightToRecord = dailyLog.weightEvening ? parseFloat(dailyLog.weightEvening) : (type === 'morning' ? val : null);
    
    if (weightToRecord) {
      const today = getTodayDate();
      const idx = history.findIndex(h => h.date === today);
      const record = { date: today, weight: weightToRecord, consumed: dailyLog.consumed, burned: dailyLog.burned, aiSummary: dailyLog.aiSummary || null };
      let newHist = idx >= 0 ? [...history] : [...history, record];
      if (idx >= 0) { newHist[idx] = { ...newHist[idx], ...record }; }
      setHistory(newHist);
      await saveHistory(newHist);
    }
  };

  // --- 修改：使用火山引擎大模型识别体重秤读数 ---
  const handleImageOCR = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsRecognizing(true);
    
    try {
      const base64Image = await fileToBase64(file);
      const prompt = `这张图片是一个体重秤的读数，请准确提取其中的数字读数（如果单位是斤，请换算为kg公斤，如果本身就是kg或未标明单位则直接提取数字）。请严格返回JSON格式：{"weight": 提取的体重数字（保留一位小数的浮点数）}`;
      
      const result = await callVolcengineVision(base64Image, prompt);
      
      if (result && result.weight) {
        const numVal = result.weight.toString();
        setDailyLog(prev => { 
            const updated = { ...prev, [type === 'morning' ? 'weightMorning' : 'weightEvening']: numVal }; 
            saveLog(updated); 
            return updated; 
        });
        alert(`🎉 火山引擎识别成功: ${numVal}kg，请核对后点击输入框外保存。`);
      } else {
        alert("无法从图片中识别出体重数字，请确保图片清晰包含体重秤屏幕。");
      }
    } catch (err) { 
        console.error("API 体重图片识别失败:", err); 
        alert("视觉识别失败，请检查网络或大模型配置。"); 
    } finally { 
        setIsRecognizing(false); 
    }
    
    e.target.value = ''; 
  };

  const handleFoodImageOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsRecognizingFood(true);
    try {
        const base64Image = await fileToBase64(file);
        const prompt = `这张图片里大概是什么食物？大概包含多少大卡的热量(1份/常规食用量)？请严格返回JSON格式：{"name": "简短食物名称", "cal": 热量整数数字}`;
        const result = await callVolcengineVision(base64Image, prompt);
        if (result.name) setCustomFoodName(result.name);
        if (result.cal) setCustomFoodCal(result.cal);
    } catch (err) {
        console.error("API 食物图片识别失败:", err);
        alert("食物图像识别失败，请检查网络或大模型配置。");
    } finally {
        setIsRecognizingFood(false);
    }
    e.target.value = ''; 
  };

  const handleSmartFoodSearch = async () => {
    if (!customFoodName) return;
    setIsSearchingFood(true);
    try {
        const prompt = `请提供1份常见或常规食用量【${customFoodName}】的大概热量(大卡)。请严格返回JSON格式：{"cal": 热量(整数数字)}`;
        const result = await callVolcengineText(prompt);
        if (result && result.cal) {
            setCustomFoodCal(result.cal);
        } else {
            alert("未找到相关热量数据");
        }
    } catch (err) {
        console.error("API 食物热量搜索失败:", err);
        alert("搜索失败，请检查网络或大模型配置。");
    } finally {
        setIsSearchingFood(false);
    }
  };

  const enterPlanDetail = (plan) => { 
      setActivePlan(plan); 
      setView('detail'); 
      setActiveTab('dashboard'); 
      setIsGeneratingReport(false); 
  };

  const handleSaveExerciseModule = async (newModule) => {
    let newModules;
    if (newModule.id) {
       newModules = exerciseModules.map(m => m.id === newModule.id ? newModule : m);
    } else {
       newModules = [...exerciseModules, { ...newModule, id: Date.now().toString() }];
    }
    setExerciseModules(newModules);
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'exercise_modules'), { list: newModules });
  };

  const handleDeleteExerciseModule = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("确定删除这个运动模块吗？")) return;
    const newModules = exerciseModules.filter(m => m.id !== id);
    setExerciseModules(newModules);
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'exercise_modules'), { list: newModules });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-teal-100 font-medium mb-1">今日热量余额</h3>
            <div className="text-5xl font-bold mb-6">{Math.max(0, activePlan.dailyCal - dailyLog.consumed + dailyLog.burned)} <span className="text-lg font-normal opacity-80">kcal</span></div>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex-1"><div className="text-xs text-teal-100 mb-1">已摄入</div><div className="font-bold text-xl">{dailyLog.consumed}</div></div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex-1"><div className="text-xs text-teal-100 mb-1">运动消耗</div><div className="font-bold text-xl">{dailyLog.burned}</div></div>
            </div>
          </div>
          <BrainCircuit className="absolute -bottom-4 -right-4 text-white opacity-10" size={140} />
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative">
          {isRecognizing && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-10 flex items-center justify-center rounded-3xl flex-col"><Loader2 className="animate-spin text-indigo-500 dark:text-indigo-400 mb-2"/><span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">大模型识图中...</span></div>}
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Scale size={18} className="text-indigo-500 dark:text-indigo-400"/> 体重打卡</h3>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center relative group">
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1 flex justify-center items-center gap-1"><Sun size={12}/> 晨重</div>
                <input type="number" placeholder="0.0" value={dailyLog.weightMorning} onChange={e => handleWeightInput('morning', e.target.value)} onBlur={() => handleWeightBlur('morning')} className="w-full bg-transparent text-center font-bold text-lg outline-none dark:text-slate-100"/>
                <label className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors opacity-0 group-hover:opacity-100"><Camera size={14} className="text-indigo-500 dark:text-indigo-400"/><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageOCR(e, 'morning')} disabled={isRecognizing}/></label>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center relative group">
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-1 flex justify-center items-center gap-1"><Moon size={12}/> 晚重</div>
                <input type="number" placeholder="0.0" value={dailyLog.weightEvening} onChange={e => handleWeightInput('evening', e.target.value)} onBlur={() => handleWeightBlur('evening')} className="w-full bg-transparent text-center font-bold text-lg outline-none dark:text-slate-100"/>
                <label className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors opacity-0 group-hover:opacity-100"><Camera size={14} className="text-indigo-500 dark:text-indigo-400"/><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageOCR(e, 'evening')} disabled={isRecognizing}/></label>
            </div>
          </div>
          {dailyLog.warnings.length > 0 && <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-2 rounded-lg">{dailyLog.warnings[0]}</div>}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><Activity size={18} className="text-teal-500 dark:text-teal-400"/> 营养摄入</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <ProgressBar label="蛋白质" current={dailyLog.meals.reduce((a,m)=>a+(m.p||0),0)} target={activePlan.macros.p} color="bg-emerald-500 dark:bg-emerald-400"/>
           <ProgressBar label="碳水" current={dailyLog.meals.reduce((a,m)=>a+(m.c||0),0)} target={activePlan.macros.c} color="bg-blue-500 dark:bg-blue-400"/>
           <ProgressBar label="脂肪" current={dailyLog.meals.reduce((a,m)=>a+(m.f||0),0)} target={activePlan.macros.f} color="bg-amber-500 dark:bg-amber-400"/>
        </div>
      </div>
    </div>
  );

  const renderDiet = () => (
    <div className="space-y-4 pb-20 relative">
      <div className="flex justify-end mb-2"><button onClick={() => setShowPrefModal(true)} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"><Settings size={14}/> 管理偏好</button></div>
      {[{ id: 'breakfast', label: '早餐' }, { id: 'lunch', label: '午餐' }, { id: 'snack', label: '加餐' }, { id: 'dinner', label: '晚餐' }, { id: 'treat', label: '快乐时刻' }].map(mt => (
        <div key={mt.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center mb-3"><h3 className="font-bold text-slate-700 dark:text-slate-200">{mt.label}</h3><button onClick={() => setActiveMealEditor(activeMealEditor === mt.id ? null : mt.id)} className="w-6 h-6 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center hover:bg-teal-100 dark:hover:bg-teal-900/50"><Plus size={16}/></button></div>
           
           {activeMealEditor === mt.id && (
             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-3 animate-in fade-in">
               <div className="flex gap-2 mb-2 relative">
                 <div className="flex-[2] relative">
                    <input className="w-full p-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:bg-slate-900 dark:text-slate-200" placeholder="食物名称" value={customFoodName} onChange={e => setCustomFoodName(e.target.value)} />
                    <button 
                        type="button"
                        onClick={handleSmartFoodSearch} 
                        disabled={isSearchingFood || !customFoodName}
                        className="absolute right-2 top-2 text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 disabled:opacity-50"
                        title="AI 智能查热量"
                    >
                        {isSearchingFood ? <Loader2 size={16} className="animate-spin"/> : <SearchIcon size={16}/>}
                    </button>
                 </div>
                 <div className="flex-[1.5] relative">
                    <input className="w-full p-2 pr-8 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:bg-slate-900 dark:text-slate-200" type="number" placeholder="卡路里" value={customFoodCal} onChange={e => setCustomFoodCal(e.target.value)} />
                    <label className="absolute right-2 top-2 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer p-0.5" title="拍照/上传图片大模型识别卡路里">
                        {isRecognizingFood ? <Loader2 size={16} className="animate-spin"/> : <Camera size={16}/>}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFoodImageOCR} disabled={isRecognizingFood}/>
                    </label>
                 </div>
               </div>
               <div className="flex gap-2 mb-3">
                 {[1, 0.5, 0.25].map(p => <button key={p} onClick={()=>setFoodPortion(p)} className={`flex-1 py-1 rounded-lg text-xs font-bold border ${foodPortion===p?'bg-teal-500 border-teal-500 text-white':'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{p===1?'全份':p*100+'%'}</button>)}
               </div>
               <button onClick={() => { if(!customFoodCal) return; addFood({ name: customFoodName + (foodPortion!==1?` (x${foodPortion})`:''), cal: Math.round(customFoodCal * foodPortion), category: mt.id==='treat'?'treat':'normal' }, mt.label); setActiveMealEditor(null); setCustomFoodName(''); setCustomFoodCal(''); setFoodPortion(1); }} className="w-full bg-teal-600 text-white py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-teal-700">添加记录</button>
             </div>
           )}

           <div className="space-y-2">{dailyLog.meals.filter(m => m.time === mt.label).map((m, i) => <div key={i} className="flex justify-between items-center text-sm bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-lg border border-transparent dark:border-slate-800"><span className="dark:text-slate-300">{m.name}</span><div className="flex items-center gap-3"><span className="font-mono font-medium text-slate-600 dark:text-slate-400">{m.cal}</span><button onClick={() => removeMeal(dailyLog.meals.indexOf(m))} className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400"><Trash2 size={14}/></button></div></div>)}</div>
           <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">{foodDB[mt.id]?.map((food, idx) => <button key={`db-${idx}`} onClick={() => addFood(food, mt.label)} className="shrink-0 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300 shadow-sm hover:text-teal-600 dark:hover:text-teal-400">+ {food.name}</button>)}{(mt.id === 'snack' || mt.id === 'treat' || mt.id === 'breakfast' || mt.id === 'lunch') && activePlan.customPreferences?.map((p, idx) => { const currentMonday = getMondayDate(); const recordedWeek = p.stats?.weekStart; const currentCount = (p.rule?.type === 'weekly' && recordedWeek !== currentMonday) ? 0 : (p.stats?.count || 0); const limit = p.rule?.limit || 999; if (p.rule?.type === 'weekly' && currentCount >= limit) return null; return (<button key={`pref-${idx}`} onClick={() => addFood(p.info, mt.label)} className="shrink-0 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800/50 rounded-full text-xs text-orange-600 dark:text-orange-400 shadow-sm flex items-center gap-1">+ {p.name} <span className="text-[10px] opacity-60 bg-orange-100 dark:bg-orange-900/50 px-1 rounded">{p.rule?.type === 'daily' ? '日' : '周'} {currentCount}/{limit}</span></button>); })}</div>
        </div>
      ))}
    </div>
  );

  const renderExercise = () => (
    <div className="space-y-4 pb-20">
       <ExerciseEditModal isOpen={showExEditModal} onClose={() => setShowExEditModal(false)} exercise={editingExerciseModule} onSave={handleSaveExerciseModule} />
       <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4"><Flame className="text-orange-500 dark:text-orange-400" size={20}/> <span className="font-bold dark:text-slate-100">今日运动</span></div>
          {dailyLog.exercises.length === 0 ? <div className="text-center text-slate-300 dark:text-slate-600 py-4 text-sm">去动一动吧！</div> : (
             <div className="space-y-3">{dailyLog.exercises.map((ex, i) => <div key={i} className="flex justify-between items-center text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-transparent dark:border-slate-700"><span className="font-medium text-slate-700 dark:text-slate-300">{ex.name} ({ex.duration}分钟)</span><div className="flex items-center gap-3"><span className="font-bold text-emerald-600 dark:text-emerald-400">-{ex.calories}</span><button onClick={()=>removeExercise(i)}><Trash2 size={14} className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400"/></button></div></div>)}</div>
          )}
       </div>
       <div className="grid grid-cols-2 gap-3">
          {exerciseModules.map(ex => (
             <div key={ex.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-700 transition-colors cursor-pointer relative group" onClick={() => setIsAddingExercise(ex.id)}>
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2 mb-2"><div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 p-2 rounded-full"><Dumbbell size={16}/></div><span className="font-bold text-sm text-slate-700 dark:text-slate-200">{ex.name}</span></div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); setEditingExerciseModule(ex); setShowExEditModal(true); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Edit size={12}/></button><button onClick={(e) => handleDeleteExerciseModule(e, ex.id)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={12}/></button></div>
                </div>
                {isAddingExercise === ex.id ? (
                   <div className="flex gap-2 mt-2 animate-in fade-in" onClick={e=>e.stopPropagation()}><input className="w-12 p-1 border border-slate-200 dark:border-slate-700 rounded text-center text-sm outline-none dark:bg-slate-800 dark:text-slate-200" value={exerciseDurationInput} onChange={e=>setExerciseDurationInput(e.target.value)} autoFocus/><button onClick={()=>{addExercise(ex, exerciseDurationInput); setIsAddingExercise(null);}} className="flex-1 bg-teal-500 text-white rounded text-xs font-bold hover:bg-teal-600 transition-colors">确认</button></div>
                ) : <div className="text-xs text-slate-400 dark:text-slate-500">约 {Math.round(ex.calPerMin * 30)} kcal / 30分</div>}
             </div>
          ))}
          <button onClick={() => { setEditingExerciseModule(null); setShowExEditModal(true); }} className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-4 text-slate-400 dark:text-slate-500 hover:border-teal-300 dark:hover:border-teal-700 hover:text-teal-500 dark:hover:text-teal-400 transition-colors min-h-[90px]"><Plus size={24}/><span className="text-xs font-bold mt-1">添加运动</span></button>
       </div>
    </div>
  );

  const renderProgress = () => {
    const chartData = (() => {
        if (!activePlan) return [];
        
        const [sYear, sMonth, sDay] = activePlan.startDate.split('-').map(Number);
        const [eYear, eMonth, eDay] = activePlan.endDate.split('-').map(Number);
        
        const startDateObj = new Date(sYear, sMonth - 1, sDay);
        const endDateObj = new Date(eYear, eMonth - 1, eDay);
        
        const totalDays = Math.max(1, Math.ceil((endDateObj - startDateObj) / 86400000));
        const dailyLoss = (activePlan.currentWeight - activePlan.targetWeight) / totalDays;
        
        const chart = [];
        for (let i = 0; i <= totalDays; i++) {
           const d = new Date(sYear, sMonth - 1, sDay);
           d.setDate(d.getDate() + i);
           
           const year = d.getFullYear();
           const month = String(d.getMonth() + 1).padStart(2, '0');
           const day = String(d.getDate()).padStart(2, '0');
           const dStr = `${year}-${month}-${day}`;

           const log = history.find(h => h.date === dStr);
           
           let idealWeight = activePlan.dailyTrend && activePlan.dailyTrend[i] !== undefined
                ? activePlan.dailyTrend[i]
                : parseFloat((activePlan.currentWeight - dailyLoss * i).toFixed(2));
                
           idealWeight = typeof idealWeight === 'number' ? parseFloat(idealWeight.toFixed(2)) : parseFloat(idealWeight);

           chart.push({ 
               fullDate: dStr, 
               date: `${d.getMonth()+1}/${d.getDate()}`, 
               ideal: idealWeight, 
               actual: log ? log.weight : null, 
               consumed: log ? log.consumed : null, 
               burned: log ? log.burned : null,
               aiSummary: log ? log.aiSummary : null 
           });
        }
        return chart;
    })();

    const todayStr = getTodayDate();
    const todaySummary = {
        fullDate: todayStr, 
        date: "今天",
        actual: dailyLog.weightEvening || dailyLog.weightMorning || "未记录",
        target: (() => {
            const start = new Date(activePlan.startDate);
            const today = new Date(todayStr);
            const daysPassed = Math.max(0, Math.ceil((today - start) / 86400000));
            const totalDays = Math.max(1, Math.ceil((new Date(activePlan.endDate) - start) / 86400000));
            
            if (activePlan.dailyTrend && activePlan.dailyTrend[daysPassed] !== undefined) {
                return parseFloat(activePlan.dailyTrend[daysPassed]).toFixed(2);
            }
            const dailyLoss = (activePlan.currentWeight - activePlan.targetWeight) / totalDays;
            return (activePlan.currentWeight - dailyLoss * daysPassed).toFixed(2);
        })(),
        consumed: dailyLog.consumed,
        burned: dailyLog.burned,
        aiSummary: dailyLog.aiSummary,
        isToday: true
    };

    const displayData = hoveredChartData ? {
        fullDate: hoveredChartData.fullDate,
        date: hoveredChartData.fullDate === todayStr ? "今天" : hoveredChartData.date,
        actual: hoveredChartData.actual || "未记录",
        target: hoveredChartData.ideal,
        consumed: hoveredChartData.consumed || 0,
        burned: hoveredChartData.burned || 0,
        aiSummary: hoveredChartData.aiSummary,
        isToday: hoveredChartData.fullDate === todayStr
    } : todaySummary;

    let adviceText = "暂无数据。";
    if (displayData.actual !== "未记录") {
        const diff = (displayData.actual - displayData.target).toFixed(1);
        if (diff <= 0.5) adviceText = "非常棒！体重控制在理想范围内。";
        else adviceText = `距离目标进度差 ${diff}kg，请留意饮食。`;
    }

    return (
       <div className="space-y-6 pb-20">
          <div className="flex justify-end">
            <button 
                onClick={syncHistoryFromLogs} 
                disabled={isSyncing}
                className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors"
            >
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""}/>
                {isSyncing ? '同步中...' : '同步历史数据'}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-80">
             <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} onMouseMove={(state) => { if (state.activePayload && state.activePayload.length > 0) { setHoveredChartData(state.activePayload[0].payload); } }} onMouseLeave={() => setHoveredChartData(null)}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                   <XAxis dataKey="date" tick={{fontSize:10, fill:'#94a3b8'}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
                   <YAxis domain={['auto', 'auto']} hide/>
                   <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}} labelStyle={{color: '#64748b', fontSize: '12px', marginBottom: '5px'}}/>
                   <Legend verticalAlign="top" iconType="circle" wrapperStyle={{fontSize:'12px', paddingBottom:'20px'}}/>
                   <Line name="标准" type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" dot={false} strokeWidth={2}/>
                   <Area name="实际" type="monotone" dataKey="actual" stroke="#10b981" fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} connectNulls={true} />
                   <defs><linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                </ComposedChart>
             </ResponsiveContainer>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-4 text-white flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={20}/> 
                    <span className="font-bold">{displayData.date} 分析日报</span>
                    {displayData.isToday && <span className="text-xs bg-white/20 px-2 py-1 rounded">实时</span>}
                </div>
                <button 
                    onClick={() => handleGenerateAIReport(displayData.fullDate || getTodayDate())}
                    disabled={isGeneratingReport}
                    className="px-4 py-2 bg-white text-teal-600 dark:bg-slate-800 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 text-sm font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2 w-full md:w-auto justify-center disabled:opacity-50"
                >
                    {isGeneratingReport ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isGeneratingReport ? 'AI分析中...' : (displayData.aiSummary ? '重新生成分析' : 'AI 深度分析')}
                </button>
             </div>
             <div className="p-6">
                <div className="flex items-center justify-between mb-6"><div><div className="text-xs text-slate-400 dark:text-slate-500 mb-1">实际体重</div><div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{displayData.actual} <span className="text-xs font-normal">kg</span></div></div><div className="text-right"><div className="text-xs text-slate-400 dark:text-slate-500 mb-1">目标体重</div><div className="text-xl font-bold text-slate-400 dark:text-slate-500">{displayData.target} <span className="text-xs font-normal">kg</span></div></div></div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{adviceText}</p>

                {isGeneratingReport ? (
                    <div className="mt-4 flex flex-col items-center justify-center py-6 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Loader2 size={24} className="animate-spin text-teal-500 dark:text-teal-400 mb-4"/>
                        <p className="text-sm">正在分析您的晨晚体重差异、饮食与运动数据...</p>
                    </div>
                ) : displayData.aiSummary ? (
                    <div className="mt-4 text-sm text-slate-700 dark:text-slate-300 bg-teal-50/50 dark:bg-teal-900/20 p-5 rounded-xl whitespace-pre-wrap leading-relaxed border border-teal-100 dark:border-teal-800/50">
                        <div className="font-bold text-teal-700 dark:text-teal-400 mb-2 flex items-center gap-1">
                            <Sparkles size={16}/> AI 智能分析结果：
                        </div>
                        {displayData.aiSummary}
                    </div>
                ) : null}

                {(displayData.consumed > 0 || displayData.burned > 0) && (<div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"><div className="text-center"><div className="text-xs text-slate-400 dark:text-slate-500">摄入</div><div className="font-bold text-slate-700 dark:text-slate-300">{displayData.consumed} kcal</div></div><div className="text-center"><div className="text-xs text-slate-400 dark:text-slate-500">消耗</div><div className="font-bold text-slate-700 dark:text-slate-300">{displayData.burned} kcal</div></div></div>)}
             </div>
          </div>
       </div>
    );
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-teal-500 dark:text-teal-400" /></div>;

  if (view === 'list') {
    return (
      <div className="h-full flex flex-col space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-3"><div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400"><Activity size={24}/></div><div><h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">体重管理</h2><p className="text-slate-400 dark:text-slate-500 text-xs">制定目标，科学管理</p></div></div>
           <button onClick={() => { setFormData({ name: '', height: 165, currentWeight: 60, targetWeight: 55, age: 25, gender: 'female', activityLevel: 1.2, goal: 'loss', startDate: getTodayDate(), endDate: getFutureDate(8) }); setCustomPreferences([]); setView('create'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all"><Plus size={18}/> 新增计划</button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           {plans.length === 0 ? (<div className="h-64 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl m-1"><Scale size={48} className="mb-4 opacity-20 dark:opacity-40"/><p>暂无计划，请点击右上角新增</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{plans.map(plan => { const status = getPlanStatus(plan.startDate, plan.endDate); return (<div key={plan.id} onClick={() => enterPlanDetail(plan)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-800/50 transition-all cursor-pointer group relative"><div className="flex justify-between items-start mb-4"><div><h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">{plan.name}</h3><div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{plan.createDate}</div></div><span className={`px-2 py-1 text-xs font-bold rounded ${status.color}`}>{status.text}</span></div><div className="grid grid-cols-2 gap-4 mb-4"><div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-transparent dark:border-slate-800"><div className="text-xs text-slate-400 dark:text-slate-500 mb-1">目标体重</div><div className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{plan.targetWeight} <span className="text-xs">kg</span></div></div><div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-transparent dark:border-slate-800"><div className="text-xs text-slate-400 dark:text-slate-500 mb-1">每日热量</div><div className="text-orange-600 dark:text-orange-400 font-bold text-lg">{plan.dailyCal} <span className="text-xs">kcal</span></div></div></div><div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500"><span>起始: {plan.currentWeight}kg</span><span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 group-hover:underline">进入打卡 <ChevronRight size={12}/></span></div><div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all"><button onClick={(e) => startEditPlan(e, plan)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"><Edit size={16}/></button><button onClick={(e) => deletePlan(e, plan.id)} className="p-2 text-red-300 dark:text-red-400/50 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16}/></button></div></div>)})}</div>)}
        </div>
      </div>
    );
  }

  if (view === 'create' || view === 'edit') {
    const isEditing = view === 'edit';
    const hasStarted = isEditing && new Date(formData.startDate) <= new Date(getTodayDate());
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <BMIConfirmModal isOpen={showBMIConfirm} bmi={formData ? calculateBMI(formData.targetWeight, formData.height) : 0} onConfirm={handleGeneratePlan} onCancel={() => setShowBMIConfirm(false)} />
        <PreferencesManagerModal isOpen={showPrefModal} onClose={() => setShowPrefModal(false)} currentPreferences={customPreferences} onSave={handleUpdatePreferences} />
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-full">
           <div className="flex items-center gap-4 mb-6 shrink-0"><button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"><ArrowLeft/></button><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{isEditing?'编辑计划':'制定新计划'}</h2></div>
           <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
              <div><label className="text-xs text-slate-500 dark:text-slate-400">计划名称</label><input className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none dark:bg-slate-800 dark:text-slate-100" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs text-slate-500 dark:text-slate-400">性别</label><select disabled={hasStarted} className={`w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-100 ${hasStarted?'bg-slate-100 dark:bg-slate-800/50 opacity-50':'dark:bg-slate-800'}`} value={formData.gender} onChange={e=>setFormData({...formData, gender:e.target.value})}><option value="male">男</option><option value="female">女</option></select></div>
                 <div><label className="text-xs text-slate-500 dark:text-slate-400">年龄</label><input disabled={hasStarted} type="number" className={`w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-100 ${hasStarted?'bg-slate-100 dark:bg-slate-800/50 opacity-50':'dark:bg-slate-800'}`} value={formData.age} onChange={e=>setFormData({...formData, age:Number(e.target.value)})}/></div>
                 <div><label className="text-xs text-slate-500 dark:text-slate-400">身高(cm)</label><input disabled={hasStarted} type="number" className={`w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-100 ${hasStarted?'bg-slate-100 dark:bg-slate-800/50 opacity-50':'dark:bg-slate-800'}`} value={formData.height} onChange={e=>setFormData({...formData, height:Number(e.target.value)})}/></div>
                 <div><label className="text-xs text-slate-500 dark:text-slate-400">初始体重(kg)</label><input disabled={hasStarted} type="number" className={`w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-100 ${hasStarted?'bg-slate-100 dark:bg-slate-800/50 opacity-50':'dark:bg-slate-800'}`} value={formData.currentWeight} onChange={e=>setFormData({...formData, currentWeight:Number(e.target.value)})}/></div>
              </div>
              <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl border border-transparent dark:border-teal-900/50"><label className="text-sm font-bold text-teal-800 dark:text-teal-400">目标体重 (kg)</label><input type="number" className="w-full mt-2 p-3 border border-teal-200 dark:border-teal-800 rounded-xl text-xl font-bold text-center outline-none dark:bg-slate-800 dark:text-teal-400" value={formData.targetWeight} onChange={e=>setFormData({...formData, targetWeight:Number(e.target.value)})}/></div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs text-slate-500 dark:text-slate-400">开始日期</label><input disabled={hasStarted} type="date" className={`w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark] ${hasStarted?'bg-slate-100 dark:bg-slate-800/50 opacity-50':'dark:bg-slate-800'}`} value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value})}/></div>
                 <div><label className="text-xs text-slate-500 dark:text-slate-400">结束日期</label><input type="date" className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark] dark:bg-slate-800" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})}/></div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                 <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-bold dark:text-slate-200">偏好设置 (频率控制)</h3><button onClick={() => setShowPrefModal(true)} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800 px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">管理</button></div>
                 <div className="flex flex-wrap gap-2">{customPreferences.length === 0 ? <span className="text-xs text-slate-400 dark:text-slate-500">暂无偏好</span> : customPreferences.map((p,i)=>(<span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 dark:text-slate-300">{p.name} ({p.rule.limit}{p.rule.type==='weekly'?'次/周':'次/日'})</span>))}</div>
              </div>
           </div>
           
           <button 
                onClick={isEditing ? handleUpdatePlan : handleGeneratePlan} 
                disabled={isGeneratingPlan}
                className="w-full py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition shrink-0 mt-4 disabled:opacity-50 flex justify-center items-center gap-2"
           >
               {isGeneratingPlan && <Loader2 size={18} className="animate-spin" />}
               {isGeneratingPlan ? '大模型正在规划...' : (isEditing ? '保存修改' : '生成智能计划')}
           </button>
        </div>
      </div>
    );
  }

  if (view === 'result' && generatedResult) {
    return (
      <div className="h-full flex flex-col max-w-2xl mx-auto animate-in zoom-in-95 p-4">
         <div className="flex items-center gap-4 mb-6"><button onClick={() => setView('create')} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"><ArrowLeft/></button><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">方案预览</h2></div>
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex-1 overflow-y-auto custom-scrollbar space-y-6">
           <div className="text-center mb-6"><div className="text-sm text-slate-400 dark:text-slate-500 mb-2">每日推荐热量</div><div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">{generatedResult.dailyCal} <span className="text-lg text-slate-400 dark:text-slate-500">kcal</span></div><div className="mt-4 flex justify-center gap-4"><div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs dark:text-slate-300">BMI: {calculateBMI(generatedResult.currentWeight, generatedResult.height)}</div><div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs dark:text-slate-300">基础代谢: {generatedResult.bmr}</div></div></div>
           <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/50"><h3 className="font-bold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2"><Utensils size={18}/> 饮食建议</h3><p className="text-sm text-orange-900/80 dark:text-orange-200/80 leading-relaxed">{generatedResult.dietAdvice}</p></div>
           <button onClick={confirmSavePlan} className="w-full py-4 bg-black dark:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-indigo-700 shadow-lg dark:shadow-none transition-colors"><Save size={20}/> 确认并在列表中创建</button>
        </div>
      </div>
    );
  }

  if (view === 'detail' && activePlan) {
    return (
      <div className="h-full flex flex-col animate-in fade-in space-y-4">
        
        <PreferencesManagerModal isOpen={showPrefModal} onClose={() => setShowPrefModal(false)} currentPreferences={activePlan.customPreferences} onSave={handleUpdatePreferences} />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
           <div className="flex items-center gap-2"><button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><ArrowLeft size={20}/></button><div><h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activePlan.name}</h2><p className="text-xs text-slate-400 dark:text-slate-500">目标: {activePlan.targetWeight}kg · 剩余: {activePlan.dailyCal - dailyLog.consumed + dailyLog.burned} kcal</p></div></div>
           <div className="flex items-center gap-2">
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl mr-2">
                  {[{id:'dashboard', label:'概览', icon:LayoutDashboard}, {id:'diet', label:'饮食', icon:Utensils}, {id:'exercise', label:'运动', icon:Dumbbell}, {id:'progress', label:'趋势', icon:TrendingUp}].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><tab.icon size={16}/> <span className="hidden md:inline">{tab.label}</span></button>
                  ))}
              </div>
              <button onClick={(e) => startEditPlan(e, activePlan)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Edit size={18}/></button>
           </div>
        </div>
        <div className="flex-1 overflow-auto pr-1 pb-10 custom-scrollbar">
           {activeTab === 'dashboard' && renderDashboard()}
           {activeTab === 'diet' && renderDiet()}
           {activeTab === 'exercise' && renderExercise()}
           {activeTab === 'progress' && renderProgress()}
        </div>
      </div>
    );
  }

  return null;
}