import { useState } from 'react';
import { Plus, Trash2, X, LayoutTemplate } from 'lucide-react';

export const ModuleManager = ({ isOpen, onClose, modules, onSaveModule, onDeleteModule }) => {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ start: '09:00', end: '10:00', module: '学习', sub: '', content: '', tag: '无' });

  const handleEditClick = (mod) => {
    setEditingId(mod.id);
    setForm(mod);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ start: '09:00', end: '10:00', module: '学习', sub: '', content: '', tag: '无' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newModule = { ...form, id: editingId || Date.now().toString() };
    onSaveModule(newModule);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><LayoutTemplate size={20}/> 常用模块管理</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"/></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <button onClick={resetForm} className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 text-xs mb-2">
              <Plus size={14}/> 新增模板
            </button>
            {modules.map(m => (
              <div key={m.id} onClick={() => handleEditClick(m)} className={`p-3 rounded-xl border cursor-pointer transition-all text-left group ${editingId === m.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700'}`}>
                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{m.content || '未命名事项'}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between items-center">
                   <span>{m.module}</span>
                   <button onClick={(e) => { e.stopPropagation(); onDeleteModule(m.id); }} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
            {modules.length === 0 && <div className="text-center text-xs text-slate-300 dark:text-slate-600 py-4">暂无模板</div>}
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase">{editingId ? '编辑模板' : '创建新模板'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">默认开始</label><input type="time" value={form.start} onChange={e=>setForm({...form, start:e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none dark:text-slate-200"/></div>
                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">默认结束</label><input type="time" value={form.end} onChange={e=>setForm({...form, end:e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none dark:text-slate-200"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">模块</label>
                    <select value={form.module} onChange={e=>setForm({...form, module:e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none dark:text-slate-200">
                      <option>工作</option><option>学习</option><option>生活</option><option>运动</option><option>其他</option>
                    </select>
                 </div>
                 <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">子分类</label><input value={form.sub} onChange={e=>setForm({...form, sub:e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none dark:text-slate-200" placeholder="如: 单词"/></div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">内容详情</label>
                <textarea value={form.content} onChange={e=>setForm({...form, content:e.target.value})} rows="3" className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none resize-none dark:text-slate-200" placeholder="例: 背诵50个新单词"/>
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">标签</label>
                  <select value={form.tag} onChange={e=>setForm({...form, tag:e.target.value})} className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm outline-none dark:text-slate-200">
                    <option>无</option><option>紧急</option><option>重要</option><option>休闲</option>
                  </select>
              </div>
              <div className="pt-4 flex justify-end">
                 <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md">保存模板</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};