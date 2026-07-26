import { useState, useEffect } from 'react';
import { User, LogOut, Lock, ShieldCheck, Image as ImageIcon, Trash2, X, CheckCircle2, AlertCircle, Loader2, Settings } from 'lucide-react';
import { AvatarCropModal } from './AvatarCropModal';
import { useAuthActions } from '../hooks/useAuth';
import { maskEmail } from '../utils';
import { VIRTUAL_EMAIL_DOMAIN } from '../constants';

export const ProfileModule = ({ user, onLogout, onNavigate }) => {
  const { updateUserProfile, updateUserPassword, updateUserEmail, reauthenticateUser } = useAuthActions();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isBindingEmail, setIsBindingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isBinding, setIsBinding] = useState(false);

  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => setMsg({ text: '', type: '' }), 6000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  const isEmailBound = user.email && !user.email.endsWith(VIRTUAL_EMAIL_DOMAIN);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUploadToImgBB = async (url) => {
    setImageToCrop(null);
    setUploading(true);
    try {
      await updateUserProfile({ photoURL: url });
      setMsg({ text: '头像更新成功', type: 'success' });
    } catch {
      setMsg({ text: '头像上传失败', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleResetAvatar = async () => {
    if (!window.confirm('确定恢复默认头像吗？')) return;
    setUploading(true);
    try {
      await updateUserProfile({ photoURL: '' });
      setMsg({ text: '已恢复默认头像', type: 'success' });
    } catch {
      setMsg({ text: '操作失败', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (currentPassword.length < 6) {
      setMsg({ text: '请输入当前密码', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ text: '新密码至少需要6位', type: 'error' });
      return;
    }
    if (currentPassword === newPassword) {
      setMsg({ text: '新密码不能与当前密码相同', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await reauthenticateUser(currentPassword);
      await updateUserPassword(newPassword);
      setMsg({ text: '密码修改成功', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setIsEditing(false);
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setMsg({ text: '当前密码输入错误', type: 'error' });
      } else if (error.code === 'auth/requires-recent-login') {
        setMsg({ text: '请先退出并重新登录后再修改密码', type: 'error' });
      } else {
        setMsg({ text: '修改失败: ' + error.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationLink = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
      setMsg({ text: '请输入格式正确的真实邮箱！', type: 'error' });
      return;
    }
    setIsBinding(true);
    try {
      await updateUserEmail(newEmail);
      setMsg({ text: '✅ 已向新邮箱发送了一封确认邮件！请前往邮箱点击链接完成绑定。', type: 'success' });
      setTimeout(() => {
        setIsBindingEmail(false);
        setNewEmail('');
      }, 5000);
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        setMsg({ text: '安全校验拦截：请先退出并重新登录账号后再来操作！', type: 'error' });
      } else if (error.code === 'auth/email-already-in-use') {
        setMsg({ text: '该邮箱已被其他账号绑定。', type: 'error' });
      } else {
        setMsg({ text: '操作失败: ' + error.message, type: 'error' });
      }
    } finally {
      setIsBinding(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 pb-10">
      {imageToCrop && <AvatarCropModal image={imageToCrop} onCropComplete={handleUploadToImgBB} onCancel={() => setImageToCrop(null)} />}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-10"></div>
        <div className="relative z-10">
          <div className="relative w-28 h-28 mx-auto mb-6 group">
            {user.photoURL ? (
              <img src={user.photoURL} className="w-full h-full rounded-full object-cover shadow-xl border-4 border-white dark:border-slate-800 transition-transform group-hover:scale-105" alt="avatar" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl border-4 border-white dark:border-slate-800">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all text-white">
              <input type="file" className="hidden" accept="image/*" onChange={onSelectFile} disabled={uploading} />
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <ImageIcon size={24} />}
            </label>
            {user.photoURL && (
              <button onClick={handleResetAvatar} className="absolute -right-2 -bottom-2 p-2 bg-white dark:bg-slate-800 text-red-500 rounded-full shadow-md border border-slate-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">{user.displayName || '用户'}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-mono bg-slate-50 dark:bg-slate-800/50 inline-block px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700/50">
            @{user.displayName || user.email?.split('@')[0]}
          </p>

          {msg.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm flex items-start text-left gap-2 animate-in fade-in slide-in-from-top-2 ${
              msg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
            }`}>
              <div className="mt-0.5">{msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}</div>
              <div className="leading-relaxed font-medium">{msg.text}</div>
            </div>
          )}

          <div className="mb-6 text-left border-t border-slate-100 dark:border-slate-800 pt-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">账号安全中心</label>
            {!isBindingEmail ? (
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
                isEmailBound
                  ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
                  : 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {isEmailBound ? (
                      <>
                        <span className="text-sm font-bold text-green-800 dark:text-green-400 flex items-center gap-1.5">
                          <ShieldCheck size={16} /> {maskEmail(user.email)}
                        </span>
                        <span className="text-[10px] text-green-600 dark:text-green-500 mt-0.5">个人邮箱已受保护</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-orange-800 dark:text-orange-400 flex items-center gap-1.5">
                          <AlertCircle size={16} /> 未绑定真实邮箱
                        </span>
                        <span className="text-[10px] text-orange-600 dark:text-orange-500 mt-0.5">忘记密码后将无法找回账号</span>
                      </>
                    )}
                  </div>
                  <button onClick={() => { setIsBindingEmail(true); setIsEditing(false); }} className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                    isEmailBound
                      ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm'
                      : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                  }`}>
                    {isEmailBound ? '更换邮箱' : '立即绑定'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendVerificationLink} className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-indigo-500 dark:text-indigo-400" />
                    {isEmailBound ? '更换个人邮箱' : '绑定个人邮箱'}
                  </span>
                  <button type="button" onClick={() => setIsBindingEmail(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                    <X size={14} />
                  </button>
                </div>
                <div>
                  <input type="email" placeholder="输入真实的个人邮箱，如: aa@qq.com" required className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium dark:text-slate-100 dark:placeholder-slate-500" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">提交后，我们将向此邮箱发送一封验证邮件，点击链接即可完成绑定。</p>
                </div>
                <button type="submit" disabled={isBinding} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none disabled:bg-indigo-400 flex justify-center items-center gap-2 mt-2">
                  {isBinding ? <Loader2 size={16} className="animate-spin" /> : '发送验证邮件'}
                </button>
              </form>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-3">
              <button onClick={() => { setIsEditing(true); setIsBindingEmail(false); }} className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 group transition-all shadow-sm">
                <Lock size={18} className="text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" /> 修改登录密码
              </button>
              <button onClick={() => onNavigate?.('settings')} className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 group transition-all shadow-sm">
                <Settings size={18} className="text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" /> 个性化设置
              </button>
              <button onClick={onLogout} className="w-full py-3.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 shadow-sm border border-red-100 dark:border-red-900/20">
                <LogOut size={18} /> 退出系统
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl text-left animate-in zoom-in-95 border border-slate-200 dark:border-slate-700/50 shadow-sm mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                  <Lock size={16} className="text-indigo-500" /> 修改登录密码
                </h3>
                <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-700">
                  <X size={14} />
                </button>
              </div>
              <input type="password" placeholder="输入当前密码" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100" />
              <input type="password" placeholder="输入新密码 (至少6位)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">取消</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none">
                  {loading ? '提交中...' : '确认修改'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};