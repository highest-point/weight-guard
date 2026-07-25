import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bold, Italic, Strikethrough, Code, Code2,
  List, ListOrdered, Quote, Link, Image,
  Heading1, Heading2, Heading3, Minus,
  Eye, Type, Undo, Redo
} from 'lucide-react';

const toolbarButtons = [
  { icon: Heading1, action: 'h1', title: '标题1' },
  { icon: Heading2, action: 'h2', title: '标题2' },
  { icon: Heading3, action: 'h3', title: '标题3' },
  { type: 'divider' },
  { icon: Bold, action: 'bold', title: '粗体' },
  { icon: Italic, action: 'italic', title: '斜体' },
  { icon: Strikethrough, action: 'strikethrough', title: '删除线' },
  { type: 'divider' },
  { icon: Code, action: 'inlineCode', title: '行内代码' },
  { icon: Code2, action: 'codeBlock', title: '代码块' },
  { type: 'divider' },
  { icon: List, action: 'unorderedList', title: '无序列表' },
  { icon: ListOrdered, action: 'orderedList', title: '有序列表' },
  { icon: Quote, action: 'quote', title: '引用' },
  { type: 'divider' },
  { icon: Link, action: 'link', title: '链接' },
  { icon: Image, action: 'image', title: '图片' },
  { icon: Minus, action: 'horizontalRule', title: '分隔线' },
  { type: 'divider' },
  { icon: Undo, action: 'undo', title: '撤销' },
  { icon: Redo, action: 'redo', title: '重做' },
];

export default function RichTextEditor({ value, onChange, name }) {
  const [showPreview, setShowPreview] = useState(false);
  const [history, setHistory] = useState([value || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (value !== history[historyIndex]) {
      setHistory([...history.slice(0, historyIndex + 1), value || '']);
      setHistoryIndex(historyIndex + 1);
    }
  }, [value]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
    }
  };

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const newText = textarea.value.substring(0, start) + before + selectedText + after + textarea.value.substring(end);
    onChange(newText);

    setTimeout(() => {
      const newCursorPos = start + before.length + (selectedText || after).length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleAction = (action) => {
    switch (action) {
      case 'h1':
        insertText('# ', '\n');
        break;
      case 'h2':
        insertText('## ', '\n');
        break;
      case 'h3':
        insertText('### ', '\n');
        break;
      case 'bold':
        insertText('**', '**');
        break;
      case 'italic':
        insertText('*', '*');
        break;
      case 'strikethrough':
        insertText('~~', '~~');
        break;
      case 'inlineCode':
        insertText('`', '`');
        break;
      case 'codeBlock':
        insertText('```\n', '\n```');
        break;
      case 'unorderedList':
        insertText('- ', '\n');
        break;
      case 'orderedList':
        insertText('1. ', '\n');
        break;
      case 'quote':
        insertText('> ', '\n');
        break;
      case 'link':
        insertText('[', '](url)');
        break;
      case 'image':
        insertText('![', '](image-url)');
        break;
      case 'horizontalRule':
        insertText('\n---\n', '');
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      handleUndo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      handleRedo();
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
      e.preventDefault();
      handleRedo();
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {toolbarButtons.map((btn, idx) => {
          if (btn.type === 'divider') {
            return <div key={idx} className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />;
          }
          const Icon = btn.icon;
          return (
            <button
              key={idx}
              onClick={() => handleAction(btn.action)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={btn.title}
            >
              <Icon size={16} />
            </button>
          );
        })}
        
        <div className="flex-1" />
        
        {/* 模式切换 */}
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowPreview(false)}
            className={`p-2 text-sm font-medium transition-colors flex items-center gap-1 ${
              !showPreview 
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Type size={14} /> 编辑
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`p-2 text-sm font-medium transition-colors flex items-center gap-1 ${
              showPreview 
                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Eye size={14} /> 预览
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      {!showPreview ? (
        <textarea
          ref={textareaRef}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={10}
          className="w-full p-4 bg-transparent resize-none outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-mono text-sm leading-relaxed"
          placeholder="开始编写笔记...支持 Markdown 语法"
        />
      ) : (
        <div className="p-4 max-h-[400px] overflow-y-auto text-slate-800 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>
            {value || '*暂无内容*'}
          </ReactMarkdown>
        </div>
      )}

      {/* Markdown 语法提示 */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span><strong>粗体</strong>: **text**</span>
          <span><em>斜体</em>: *text*</span>
          <span>标题: # h1</span>
          <span>列表: - item</span>
          <span>引用: &gt; quote</span>
          <span>代码: `code`</span>
        </div>
      </div>
    </div>
  );
}
