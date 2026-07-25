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
export const PRIORITY_MAP = { '紧急': 1, '重要': 2, '休闲': 3 };

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

// Plan Status Colors
export const PLAN_STATUS_COLORS = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  completed: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

// Chart Colors
export const CHART_COLORS = ['#6366f1', '#a855f7', '#eab308', '#22c55e', '#64748b', '#f43f5e'];

// Module Categories
export const MODULE_CATEGORIES = ['工作', '学习', '生活', '运动', '其他'];