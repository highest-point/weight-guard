import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Plus, Search, Clock, Flag,
  Edit2, Trash2, Image as ImageIcon, X,
  FileText, Loader2, Save, AlertCircle,
  File as FileIcon, Eye, Tag, Calendar,
  ChevronDown, Check, Archive, CheckCircle,
  Square, Filter, MoreVertical, GripVertical
} from 'lucide-react';
import { db, APP_ID } from '../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AttachmentItem } from '../components/AttachmentItem';
import RichTextEditor from '../components/RichTextEditor';
import { uploadToCloudinary, getUrgency, getMinDateTime } from '../utils';
import { useGlobalNotification } from '../context/NotificationContext';

// 预设标签颜色
const TAG_COLORS = [
  { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-900/30' },
  { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-900/30' },
  { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-900/30' },
  { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-900/30' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-900/30' },
  { bg: 'bg-teal-100 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-900/30' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-900/30' },
  { bg: 'bg-sky-100 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-900/30' },
  { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-900/30' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-900/30' },
  { bg: 'bg-violet-100 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-900/30' },
  { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-900/30' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/20', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-200 dark:border-fuchsia-900/30' },
  { bg: 'bg-pink-100 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-900/30' },
  { bg: 'bg-rose-100 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-900/30' },
];

// 笔记状态配置
const NOTE_STATUSES = [
  { id: 'draft', label: '草稿', icon: FileText, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  { id: 'active', label: '进行中', icon: Clock, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  { id: 'completed', label: '已完成', icon: CheckCircle, color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  { id: 'archived', label: '已归档', icon: Archive, color: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' },
];

// 排序选项
const SORT_OPTIONS = [
  { id: 'createdAt-desc', label: '最新创建', field: 'createdAt', order: 'desc' },
  { id: 'createdAt-asc', label: '最早创建', field: 'createdAt', order: 'asc' },
  { id: 'updatedAt-desc', label: '最近更新', field: 'updatedAt', order: 'desc' },
  { id: 'deadline-asc', label: '最早截止', field: 'deadline', order: 'asc' },
  { id: 'deadline-desc', label: '最晚截止', field: 'deadline', order: 'desc' },
  { id: 'priority-desc', label: '优先级高', field: 'priority', order: 'desc' },
  { id: 'priority-asc', label: '优先级低', field: 'priority', order: 'asc' },
  { id: 'title-asc', label: '标题A-Z', field: 'title', order: 'asc' },
  { id: 'title-desc', label: '标题Z-A', field: 'title', order: 'desc' },
];

export default function NoteModule({ user }) {
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [previewNote, setPreviewNote] = useState(null);
  
  const [newAttachments, setNewAttachments] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  
  // 筛选和排序状态
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // 批量选择状态
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  
  // 标签管理状态
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', colorIndex: 0 });
  
  const showNotification = useGlobalNotification();
  const minDateTime = getMinDateTime();

  // 加载笔记和标签
  useEffect(() => {
    if (!user) return;
    
    const unsubscribeNotes = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), (snap) => {
      if (snap.exists()) {
        const list = snap.data().list || [];
        const normalizedList = list.map(note => ({
          ...note,
          attachments: note.attachments || (note.attachment ? [note.attachment] : []),
          tags: note.tags || [],
          status: note.status || 'active',
        }));
        setNotes(normalizedList);
      } else {
        setNotes([]);
      }
    });
    
    const unsubscribeTags = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tags'), (snap) => {
      if (snap.exists()) {
        setTags(snap.data().list || []);
      } else {
        setTags([]);
      }
    });
    
    setTimeout(() => setLoading(false), 500);
    
    return () => {
      unsubscribeNotes();
      unsubscribeTags();
    };
  }, [user]);

  // 处理文件上传
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsSaving(true);
    const uploadedFiles = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        showNotification('error', `文件 ${file.name} 过大，跳过上传`);
        continue;
      }
      const result = await uploadToCloudinary(file);
      if (result) {
        uploadedFiles.push(result);
      }
    }

    setNewAttachments(prev => [...prev, ...uploadedFiles]);
    setIsSaving(false);
    e.target.value = '';
  };

  // 移除附件
  const handleRemoveAttachment = (attId, isNew = false) => {
    if (!window.confirm('确定移除此附件吗？')) return;

    if (isNew) {
      setNewAttachments(prev => prev.filter(a => a.id !== attId));
    } else {
      if (editingNote) {
        setEditingNote(prev => ({
          ...prev,
          attachments: prev.attachments.filter(a => a.id !== attId)
        }));
      }
    }
  };

  // 保存笔记
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.target);

    const finalAttachments = [
      ...(editingNote?.attachments || []),
      ...newAttachments
    ];

    const selectedTagIds = fd.getAll('tags');

    try {
      const newNote = {
        id: editingNote?.id || Date.now().toString(),
        title: fd.get('title'),
        priority: fd.get('priority'),
        deadline: fd.get('deadline'),
        content: editorContent,
        relatedText: fd.get('relatedText'),
        attachments: finalAttachments,
        attachment: null,
        tags: selectedTagIds,
        status: fd.get('status'),
        createdAt: editingNote?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedList = editingNote
        ? notes.map(n => n.id === newNote.id ? newNote : n)
        : [newNote, ...notes];

      await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), { list: updatedList }, { merge: true });

      showNotification('success', editingNote ? '笔记更新成功' : '笔记创建成功');
      setIsModalOpen(false);
      setEditingNote(null);
      setNewAttachments([]);
    } catch (err) {
      console.error(err);
      showNotification('error', '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 删除笔记
  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这条笔记吗？')) return;
    const updatedList = notes.filter(n => n.id !== id);
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), { list: updatedList }, { merge: true });
    setSelectedNotes(prev => prev.filter(nid => nid !== id));
    showNotification('success', '笔记已删除');
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (!window.confirm(`确定删除选中的 ${selectedNotes.length} 条笔记吗？`)) return;
    const updatedList = notes.filter(n => !selectedNotes.includes(n.id));
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), { list: updatedList }, { merge: true });
    setSelectedNotes([]);
    setShowBatchMenu(false);
    showNotification('success', `${selectedNotes.length} 条笔记已删除`);
  };

  // 批量修改标签
  const handleBatchUpdateTags = async (tagIds) => {
    const updatedList = notes.map(n => 
      selectedNotes.includes(n.id) ? { ...n, tags: tagIds, updatedAt: new Date().toISOString() } : n
    );
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), { list: updatedList }, { merge: true });
    setSelectedNotes([]);
    setShowBatchMenu(false);
    showNotification('success', `${selectedNotes.length} 条笔记已更新`);
  };

  // 编辑笔记
  const handleEditNote = (note) => {
    setEditingNote(note);
    setEditorContent(note?.content || '');
    setNewAttachments([]);
    setIsModalOpen(true);
    setIsPreviewOpen(false);
  };

  // 预览笔记
  const handlePreviewNote = (note) => {
    setPreviewNote(note);
    setIsPreviewOpen(true);
  };

  // 切换笔记状态
  const handleToggleStatus = async (noteId, newStatus) => {
    const updatedList = notes.map(n => 
      n.id === noteId ? { ...n, status: newStatus, updatedAt: new Date().toISOString() } : n
    );
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), { list: updatedList }, { merge: true });
    const statusLabel = NOTE_STATUSES.find(s => s.id === newStatus)?.label;
    showNotification('success', `笔记状态已更新为 ${statusLabel}`);
  };

  // 创建标签
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;
    
    const tag = {
      id: Date.now().toString(),
      name: newTag.name.trim(),
      colorIndex: newTag.colorIndex,
      createdAt: new Date().toISOString()
    };
    
    const updatedTags = [...tags, tag];
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tags'), { list: updatedTags }, { merge: true });
    setNewTag({ name: '', colorIndex: 0 });
    setIsTagModalOpen(false);
    showNotification('success', '标签创建成功');
  };

  // 删除标签
  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('确定删除此标签吗？关联的笔记将不再显示该标签。')) return;
    
    const updatedTags = tags.filter(t => t.id !== tagId);
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'tags'), { list: updatedTags }, { merge: true });
    
    // 移除笔记中的该标签引用
    const updatedNotes = notes.map(n => ({
      ...n,
      tags: n.tags.filter(tid => tid !== tagId)
    }));
    await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'data', 'notes'), { list: updatedNotes }, { merge: true });
    
    setSelectedTags(prev => prev.filter(tid => tid !== tagId));
    showNotification('success', '标签已删除');
  };

  // 筛选和排序后的笔记
  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes];
    
    // 状态筛选
    if (selectedStatus !== 'all') {
      result = result.filter(n => n.status === selectedStatus);
    }
    
    // 标签筛选
    if (selectedTags.length > 0) {
      result = result.filter(n => 
        selectedTags.some(tagId => n.tags.includes(tagId))
      );
    }
    
    // 搜索筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(term) || 
        n.content.toLowerCase().includes(term) ||
        n.relatedText?.toLowerCase().includes(term)
      );
    }
    
    // 排序
    const sortConfig = SORT_OPTIONS.find(s => s.id === sortBy);
    if (sortConfig) {
      result.sort((a, b) => {
        let valA = a[sortConfig.field];
        let valB = b[sortConfig.field];
        
        // 处理优先级排序
        if (sortConfig.field === 'priority') {
          const priorityMap = { high: 3, medium: 2, low: 1 };
          valA = priorityMap[valA] || 0;
          valB = priorityMap[valB] || 0;
        }
        
        // 处理日期排序
        if (sortConfig.field === 'deadline' && valA) {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        
        // 处理字符串排序
        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [notes, searchTerm, selectedTags, selectedStatus, sortBy]);

  // 获取笔记的标签对象
  const getNoteTags = (note) => {
    return note.tags.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean);
  };

  // 获取标签颜色样式
  const getTagStyle = (colorIndex) => {
    return TAG_COLORS[colorIndex % TAG_COLORS.length];
  };

  // 切换单个笔记选择
  const toggleNoteSelection = (noteId) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedNotes.length === filteredAndSortedNotes.length) {
      setSelectedNotes([]);
    } else {
      setSelectedNotes(filteredAndSortedNotes.map(n => n.id));
    }
  };

  // 笔记卡片组件
  const NoteCard = ({ note, onEdit, onDelete, onPreview, onToggleStatus }) => {
    const urgency = getUrgency(note.deadline);
    const noteTags = getNoteTags(note);
    const isSelected = selectedNotes.includes(note.id);
    const statusConfig = NOTE_STATUSES.find(s => s.id === note.status);

    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border transition-all relative group flex flex-col h-auto min-h-[18rem] ${
        isSelected ? 'border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:shadow-md'
      }`}>
        {/* 选中复选框 */}
        <button 
          onClick={() => toggleNoteSelection(note.id)}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isSelected ? (
            <Check className="text-indigo-600 dark:text-indigo-400" size={18} />
          ) : (
            <Square className="text-slate-300 dark:text-slate-600" size={18} />
          )}
        </button>

        {/* 优先级指示器 */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
          note.priority === 'high' ? 'bg-red-500' : 
          note.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'
        }`} />

        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate pr-8">{note.title}</h3>
          <Flag size={16} className={
            note.priority === 'high' ? 'text-red-500 fill-red-500' : 
            note.priority === 'medium' ? 'text-orange-500 fill-orange-500' : 'text-blue-500 fill-blue-500'
          } />
        </div>

        <div className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 mb-4 flex-1 overflow-hidden leading-relaxed">
            <ReactMarkdown>
              {note.content || ''}
            </ReactMarkdown>
          </div>

        {/* 标签 */}
        {noteTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {noteTags.map(tag => {
              const style = getTagStyle(tag.colorIndex);
              return (
                <span key={tag.id} className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                  {tag.name}
                </span>
              );
            })}
          </div>
        )}

        {/* 附件 */}
        {note.attachments?.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-1.5">
              <FileIcon size={10} /> 附件 ({note.attachments.length})
            </div>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {note.attachments.slice(0, 3).map((att, idx) => (
                <AttachmentItem key={att.id || idx} att={att} isCompact={true} />
              ))}
              {note.attachments.length > 3 && (
                <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-1">
                  +{note.attachments.length - 3} 更多
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50 mt-auto">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${urgency.color}`}>
              <Clock size={10} className="inline mr-1" /> {urgency.text}
            </span>
            {statusConfig && (
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            )}
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onPreview(note)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="预览">
              <Eye size={16} />
            </button>
            <button onClick={() => onEdit(note)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="编辑">
              <Edit2 size={16} />
            </button>
            <button onClick={() => onDelete(note.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="删除">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 dark:text-indigo-400" /></div>;

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in">
      {/* 顶部工具栏 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="text-indigo-500 dark:text-indigo-400" /> 
            云端记事本
          </h2>
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
            {filteredAndSortedNotes.length} 条笔记
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* 搜索框 */}
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="搜索笔记..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 dark:text-slate-200 transition-colors" 
            />
          </div>
          
          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Filter size={18} />
            <span className="text-sm font-medium hidden sm:inline">筛选</span>
          </button>
          
          {/* 排序下拉 */}
          <div className="relative">
            <button 
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
              onClick={() => setShowBatchMenu(!showBatchMenu)}
            >
              <GripVertical size={18} />
              <span className="text-sm font-medium hidden sm:inline">排序</span>
              <ChevronDown size={16} />
            </button>
            
            {showBatchMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-20 overflow-hidden">
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => { setSortBy(option.id); setShowBatchMenu(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                      sortBy === option.id ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 新建笔记 */}
          <button
            onClick={() => { setEditingNote(null); setEditorContent(''); setNewAttachments([]); setIsModalOpen(true); }}
            className="bg-indigo-600 text-white p-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-transform active:scale-95"
            title="新建笔记"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap gap-4">
            {/* 状态筛选 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">状态:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedStatus === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  全部
                </button>
                {NOTE_STATUSES.map(status => (
                  <button
                    key={status.id}
                    onClick={() => setSelectedStatus(status.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedStatus === status.id ? status.color : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 标签筛选 */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">标签:</span>
              <div className="flex flex-wrap gap-2 flex-1">
                {tags.map(tag => {
                  const style = getTagStyle(tag.colorIndex);
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        isSelected ? `${style.bg} ${style.text} ${style.border} ring-2 ring-offset-1 ring-current` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border-transparent'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {tags.length === 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">暂无标签</span>
                )}
                <button
                  onClick={() => setIsTagModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-dashed border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Plus size={12} /> 添加标签
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedNotes.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">
                已选择 {selectedNotes.length} 条笔记
              </span>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                {selectedNotes.length === filteredAndSortedNotes.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setSelectedStatus('all');
                }}
                className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                清除筛选
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> 批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 笔记列表 */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {filteredAndSortedNotes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
            <AlertCircle size={48} className="mb-2 opacity-10 dark:opacity-20" />
            <p>暂无相关笔记</p>
            <button
              onClick={() => { setEditingNote(null); setNewAttachments([]); setIsModalOpen(true); }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              创建第一条笔记
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAndSortedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDelete}
                onPreview={handlePreviewNote}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* 新建/编辑笔记模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingNote ? '编辑笔记' : '新建笔记'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input 
                name="title" 
                required 
                defaultValue={editingNote?.title} 
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                placeholder="输入标题..." 
              />
              
              <div className="grid grid-cols-3 gap-4">
                <select 
                  name="priority" 
                  defaultValue={editingNote?.priority || 'medium'} 
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all dark:text-slate-100 appearance-none"
                >
                  <option value="low">低优先级</option>
                  <option value="medium">普通</option>
                  <option value="high">高优先级</option>
                </select>
                <select 
                  name="status" 
                  defaultValue={editingNote?.status || 'active'} 
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all dark:text-slate-100 appearance-none"
                >
                  {NOTE_STATUSES.map(status => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
                <input
                  name="deadline"
                  type="datetime-local"
                  defaultValue={editingNote?.deadline}
                  min={minDateTime}
                  className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all dark:text-slate-100 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              
              <RichTextEditor
                name="content"
                value={editorContent}
                onChange={setEditorContent}
              />

              {/* 标签选择 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Tag size={12} /> 选择标签
                  </h3>
                  <button
                    type="button"
                    onClick={() => { setIsTagModalOpen(true); }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                  >
                    + 添加新标签
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const style = getTagStyle(tag.colorIndex);
                    const isChecked = editingNote?.tags?.includes(tag.id);
                    return (
                      <label key={tag.id} className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        isChecked ? `${style.bg} ${style.text} ${style.border} ring-2 ring-offset-1 ring-current` : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                      }`}>
                        <input type="checkbox" name="tags" value={tag.id} checked={isChecked} className="hidden" />
                        {tag.name}
                      </label>
                    );
                  })}
                  {tags.length === 0 && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">暂无标签，点击上方添加</span>
                  )}
                </div>
              </div>

              {/* 附件和备注 */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <input 
                  name="relatedText" 
                  placeholder="备注信息 (可选)..." 
                  defaultValue={editingNote?.relatedText} 
                  className="w-full p-2 mb-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 transition-colors dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" 
                />

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">附件列表</h3>
                  <label className={`cursor-pointer bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Plus size={14} /> {isSaving ? '上传中...' : '添加附件'}
                    <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={isSaving} />
                  </label>
                </div>

                <div className="space-y-2">
                  {editingNote?.attachments?.map((att) => (
                    <AttachmentItem key={att.id || att.url} att={att} onDelete={() => handleRemoveAttachment(att.id, false)} />
                  ))}
                  {newAttachments.map((att) => (
                    <AttachmentItem key={att.id} att={att} onDelete={() => handleRemoveAttachment(att.id, true)} />
                  ))}
                  {(!editingNote?.attachments?.length && newAttachments.length === 0) && (
                    <div className="text-center py-4 text-slate-300 dark:text-slate-600 text-xs">暂无附件，点击右上角添加</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-400 dark:text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">取消</button>
              <button type="submit" disabled={isSaving} className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 disabled:bg-indigo-300 dark:disabled:bg-indigo-800">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 保存
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 笔记预览模态框 */}
      {isPreviewOpen && previewNote && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{previewNote.title}</h2>
                <Flag size={16} className={
                  previewNote.priority === 'high' ? 'text-red-500 fill-red-500' : 
                  previewNote.priority === 'medium' ? 'text-orange-500 fill-orange-500' : 'text-blue-500 fill-blue-500'
                } />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEditNote(previewNote)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="关闭"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* 元信息 */}
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  previewNote.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 
                  previewNote.priority === 'medium' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {previewNote.priority === 'high' ? '高优先级' : previewNote.priority === 'medium' ? '普通' : '低优先级'}
                </span>
                {NOTE_STATUSES.find(s => s.id === previewNote.status) && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${NOTE_STATUSES.find(s => s.id === previewNote.status).color}`}>
                    {NOTE_STATUSES.find(s => s.id === previewNote.status).label}
                  </span>
                )}
                {previewNote.deadline && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> {new Date(previewNote.deadline).toLocaleString()}
                  </span>
                )}
              </div>
              
              {/* 标签 */}
              {getNoteTags(previewNote).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getNoteTags(previewNote).map(tag => {
                    const style = getTagStyle(tag.colorIndex);
                    return (
                      <span key={tag.id} className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                        {tag.name}
                      </span>
                    );
                  })}
                </div>
              )}
              
              {/* 内容 */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                <ReactMarkdown>
                  {previewNote.content || '*暂无内容*'}
                </ReactMarkdown>
              </div>
              
              {/* 备注 */}
              {previewNote.relatedText && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">备注信息</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{previewNote.relatedText}</p>
                </div>
              )}
              
              {/* 附件 */}
              {previewNote.attachments?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">附件列表 ({previewNote.attachments.length})</h4>
                  <div className="space-y-2">
                    {previewNote.attachments.map((att, idx) => (
                      <AttachmentItem key={att.id || idx} att={att} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 创建/更新时间 */}
              <div className="text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                创建于: {new Date(previewNote.createdAt).toLocaleString()}
                {previewNote.updatedAt !== previewNote.createdAt && (
                  <span className="ml-4">更新于: {new Date(previewNote.updatedAt).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 标签管理模态框 */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">管理标签</h2>
              <button type="button" onClick={() => setIsTagModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* 创建新标签 */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">创建新标签</h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={newTag.name} 
                  onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="标签名称"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/50 transition-all dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setNewTag(prev => ({ ...prev, colorIndex: index }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newTag.colorIndex === index ? 'border-slate-800 dark:border-slate-100 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.text.replace('text-', '#').replace('-600', '-500').replace('-400', '-500') }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleCreateTag}
                  disabled={!newTag.name.trim()}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 dark:disabled:bg-indigo-800"
                >
                  创建标签
                </button>
              </div>
            </div>
            
            {/* 现有标签 */}
            {tags.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">现有标签 ({tags.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tags.map(tag => {
                    const style = getTagStyle(tag.colorIndex);
                    return (
                      <div key={tag.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          {tag.name}
                        </span>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}