import { Eye, Trash2, File as FileIcon, Image as ImageIcon, FileText as PdfIcon, ExternalLink } from 'lucide-react';
import { getActionUrl } from '../utils';

export const AttachmentItem = ({ att, onDelete, isCompact = false }) => {
  const isPdf = att.format === 'pdf';
  const isRealImage = att.type === 'image' && !isPdf;
  const url = getActionUrl(att);

  if (isCompact) {
    return (
      <div className="flex items-center gap-1.5 p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded text-[10px] text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 group/item hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors max-w-[120px]">
        {isRealImage ? <ImageIcon size={10} className="shrink-0" /> : (isPdf ? <PdfIcon size={10} className="shrink-0" /> : <FileIcon size={10} className="shrink-0" />)}
        <span className="truncate flex-1">{att.name}</span>
        <a href={url} target="_blank" rel="noreferrer" className="hover:text-indigo-900 dark:hover:text-indigo-100 p-0.5 shrink-0" title="查看" onClick={e => e.stopPropagation()}>
          <ExternalLink size={10} />
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors group">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
          {isRealImage ? (
            <img src={att.url} className="w-full h-full object-cover rounded-lg" alt="preview" />
          ) : (
            isPdf ? <PdfIcon size={16} /> : <FileIcon size={16} />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{att.name}</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">{att.format}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <a href={url} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="在线查看">
          <Eye size={14} />
        </a>
        {onDelete && (
          <button type="button" onClick={() => onDelete(att.id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="移除">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};