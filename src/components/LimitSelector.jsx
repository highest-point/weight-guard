import { ChevronDown } from 'lucide-react';

export const LimitSelector = ({ value, onChange, options = [5, 10, 20, 50] }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      {options.map(opt => (
        <option key={opt} value={opt}>显示 {opt} 条</option>
      ))}
    </select>
    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
  </div>
);