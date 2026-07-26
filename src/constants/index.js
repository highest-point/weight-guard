// API Keys and Configurations (from .env)
export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
export const VOLCENGINE_API_KEY = import.meta.env.VITE_VOLCENGINE_API_KEY || '';
export const VOLCENGINE_ENDPOINT = import.meta.env.VITE_VOLCENGINE_ENDPOINT || '';

// Firebase Config (from .env)
export const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY || '';
export const FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '';
export const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
export const FIREBASE_STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '';
export const FIREBASE_MESSAGING_SENDER_ID = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
export const FIREBASE_APP_ID = import.meta.env.VITE_FIREBASE_APP_ID || '';
export const FIREBASE_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '';

// App Config (from .env)
export const APP_ID = import.meta.env.VITE_APP_ID || 'weight-guard-local';
export const VIRTUAL_EMAIL_DOMAIN = import.meta.env.VITE_VIRTUAL_EMAIL_DOMAIN || '@dailyplan.system';

// Event Colors
export const EVENT_COLORS = [
  { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  { id: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  { id: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
];

// Priority Map
export const PRIORITY_MAP = { '紧急': 1, '高': 2, '中': 3, '低': 4 };

// Priority Configuration
export const PRIORITY_CONFIG = {
  '紧急': { 
    label: '紧急', 
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-500',
    icon: 'AlertTriangle',
    weight: 1 
  },
  '高': { 
    label: '高', 
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    dot: 'bg-orange-500',
    icon: 'Flame',
    weight: 2 
  },
  '中': { 
    label: '中', 
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    dot: 'bg-blue-500',
    icon: 'Circle',
    weight: 3 
  },
  '低': { 
    label: '低', 
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-500',
    icon: 'Minus',
    weight: 4 
  },
};

// Default Exercise Database
export const DEFAULT_EXERCISE_DB = [
  { id: 'e1', name: '快走', calPerMin: 5.5, type: 'cardio', intensity: '中等' },
  { id: 'e2', name: '慢跑', calPerMin: 8.2, type: 'cardio', intensity: '高' },
  { id: 'e3', name: '力量训练', calPerMin: 4.7, type: 'strength', intensity: '中等' },
  { id: 'e4', name: '跳绳', calPerMin: 11.7, type: 'cardio', intensity: '极高' },
  { id: 'e5', name: '瑜伽', calPerMin: 3.3, type: 'flexibility', intensity: '低' },
];

// Exercise Calorie Lookup
export const EXERCISE_CALORIE_LOOKUP = {
  '快走': 165, '慢跑': 245, '跑步': 300,
};

// AI Knowledge Base
export const AI_KNOWLEDGE_BASE = {
  '奶茶': { cal: 300, p: 2, c: 40, f: 10, type: 'treat', category: 'treat', unit: '杯', warning: '建议选择无糖/三分糖' },
};

// Initial Food Database
export const INITIAL_FOOD_DB = { breakfast: [], lunch: [], dinner: [], snack: [], treat: [] };

// Status Configuration
export const PLAN_STATUS_CONFIG = {
  pending: { 
    label: '待开始', 
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-500',
    icon: 'Clock'
  },
  active: { 
    label: '进行中', 
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    dot: 'bg-blue-500',
    icon: 'Play'
  },
  completed: { 
    label: '已完成', 
    color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-500',
    icon: 'CheckCircle2'
  },
  paused: { 
    label: '已暂停', 
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    dot: 'bg-amber-500',
    icon: 'Pause'
  },
  cancelled: { 
    label: '已取消', 
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
    dot: 'bg-gray-400',
    icon: 'XCircle'
  },
};

// Status Transition Rules
export const STATUS_TRANSITIONS = {
  pending: ['active', 'cancelled'],
  active: ['completed', 'paused', 'cancelled'],
  completed: [],
  paused: ['active', 'cancelled'],
  cancelled: [],
};

// Plan Status Colors (backward compatibility)
export const PLAN_STATUS_COLORS = {
  pending: PLAN_STATUS_CONFIG.pending.color,
  completed: PLAN_STATUS_CONFIG.completed.color,
};

// Chart Colors
export const CHART_COLORS = ['#6366f1', '#a855f7', '#eab308', '#22c55e', '#64748b', '#f43f5e'];

// Module Categories
export const MODULE_CATEGORIES = ['工作', '学习', '生活', '运动', '其他'];