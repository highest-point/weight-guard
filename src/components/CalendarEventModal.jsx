import { useState, useEffect, useCallback } from 'react';
import { X, Paperclip, Loader2, List, Clock, Trash2, Wand2, Plus } from 'lucide-react';
import { EVENT_COLORS } from '../constants';
import { AttachmentItem } from './AttachmentItem';

export const CalendarEventModal = ({ isOpen, onClose, event, onSave, onDelete, onPlanDaily, onAIBreakdown, relatedPlans = [], uploadToCloudinary }) => {
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', color: 'blue', description: '' });
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = useCallback(() => {
    if (event) {
      setForm({
        title: event.title || '',
        startDate: event.startDate || '',
        endDate: event.endDate || '',
        color: event.color || 'blue',
        description: event.description || ''
      });
      setAttachments(event.attachments || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setForm({ title: '', startDate: today, endDate: today, color: 'blue', description: '' });
      setAttachments([]);
    }
  }, [event]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploading(true);
    const uploadedFiles = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { alert(`文件 ${file.name} 过大，跳过上传`); continue; }
      const result = await uploadToCloudinary(file);
      if (result) uploadedFiles.push(result);
    }
    setAttachments(prev => [...prev, ...uploadedFiles]);
    setIsUploading(false);
    e.target.value = ''; 
  };

  const handleRemoveAttachment = (attId) => {
    if (!window.confirm("确定移除此附件吗？")) return;
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      if (form.endDate < form.startDate) {
          alert("结束日期不能早于开始日期");
          return;
      }
      onSave({ ...form, id: event?.id, attachments });
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{event?.id ? '编辑任务' : '新增跨日任务'}</h3>
                  <button onClick={onClose}><X size={20} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"/></button>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
                <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">任务标题</label>
                        <input required autoFocus className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 font-bold dark:text-slate-100" placeholder="输入任务名称..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">开始日期</label>
                            <input required type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-200" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">结束日期</label>
                            <input required type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-slate-200" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">颜色标记</label>
                        <div className="flex gap-2">
                            {EVENT_COLORS.map(c => (
                                <button 
                                  key={c.id} 
                                  type="button" 
                                  onClick={() => setForm({...form, color: c.id})}
                                  className={`w-8 h-8 rounded-full border-2 ${form.color === c.id ? 'border-slate-600 dark:border-slate-400 scale-110' : 'border-transparent'} ${c.dot.replace('bg-', 'bg-')} shadow-sm transition-all`}
                                  style={{ backgroundColor: `var(--color-${c.id})` }} 
                                >
                                  <div className={`w-full h-full rounded-full ${c.dot}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">详细描述 (可选)</label>
                        <textarea rows="3" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none resize-none dark:text-slate-200" placeholder="备注..." value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1"><Paperclip size={12}/> 附件 (图片/文件等，可多选)</label>
                        <div className="relative group">
                          <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="*" disabled={isUploading}/>
                          <div className={`w-full border border-slate-200 dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex items-center gap-2 transition-colors ${isUploading ? 'opacity-50' : 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:border-indigo-200 dark:group-hover:border-indigo-700'}`}>
                             {isUploading ? <Loader2 size={14} className="animate-spin text-indigo-500 dark:text-indigo-400"/> : <Paperclip size={14} className="text-indigo-500 dark:text-indigo-400"/>}
                             <span className="truncate text-slate-500 dark:text-slate-400">{isUploading ? '正在上传...' : '点击添加附件'}</span>
                          </div>
                        </div>
                        
                        {attachments.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 space-y-2 mt-3">
                             {attachments.map((att) => (
                                <AttachmentItem key={att.id || att.url} att={att} onDelete={() => handleRemoveAttachment(att.id)} />
                             ))}
                          </div>
                        )}
                    </div>
                </form>

                {event?.id && (
                    <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1">
                            <List size={14} className="text-indigo-500 dark:text-indigo-400"/> 包含的每日计划 ({relatedPlans.length})
                        </label>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-2">
                            {relatedPlans.length === 0 ? (
                                <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">暂无关联的每日计划</div>
                            ) : (
                                relatedPlans.map(plan => (
                                    <div key={plan.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">{plan.date}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${plan.status === 'completed' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                {plan.status === 'completed' ? '已完成' : '待办'}
                                            </span>
                                        </div>
                                        <div className={`text-sm font-bold mt-1 ${plan.status === 'completed' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {plan.content}
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                                            <Clock size={10}/> {plan.start} - {plan.end} 
                                            <span className="bg-slate-50 dark:bg-slate-800 px-1 rounded border border-slate-100 dark:border-slate-700">{plan.module} {plan.sub && `· ${plan.sub}`}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  {event?.id && (
                    <div className="flex flex-col gap-2 mb-4">
                        <button 
                          type="button" 
                          onClick={() => onAIBreakdown(event)}
                          className="w-full py-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors shadow-sm"
                        >
                          <Wand2 size={16}/> AI 智能拆解并生成计划
                        </button>
                        <button 
                          type="button" 
                          onClick={() => onPlanDaily(event)}
                          className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <Plus size={16}/> 手动添加单日计划
                        </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                      {event?.id && (
                          <button type="button" onClick={() => onDelete(event.id)} className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"><Trash2 size={20}/></button>
                      )}
                      <button type="submit" form="event-form" disabled={isUploading} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 dark:disabled:bg-indigo-800">
                          {isUploading ? '处理中...' : '保存任务'}
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );
};