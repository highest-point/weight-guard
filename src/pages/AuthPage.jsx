import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail // 新增：重置密码方法
} from "firebase/auth";
import { auth } from '../config/firebase';
import { VIRTUAL_EMAIL_DOMAIN } from '../constants';
import { 
  LayoutDashboard, ShieldCheck, Activity, Calendar, 
  Loader2, User, Eye, EyeOff, Mail, ArrowLeft
} from 'lucide-react';

export default function AuthPage() {
  // view 状态控制当前显示的面板：'login' | 'register' | 'forgot'
  const [view, setView] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  const [form, setForm] = useState({ username: '', password: '' });
  const [resetEmail, setResetEmail] = useState(''); // 用于忘记密码的邮箱
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    // 判断用户输入的是不是已经绑定的真实邮箱 (包含 @ 符号)
    const isRealEmail = form.username.includes('@');
    const loginEmail = isRealEmail 
      ? form.username.trim() 
      : `${form.username.toLowerCase()}${VIRTUAL_EMAIL_DOMAIN}`;

    try {
      if (view === 'register') {
        if (isRealEmail) {
            setError("注册时请直接输入用户名（暂不支持直接使用邮箱注册，请注册后在个人中心绑定）");
            setLoading(false);
            return;
        }
        const usernameRegex = /^[a-zA-Z0-9_.]+$/;
        if (!usernameRegex.test(form.username)) {
           setError("用户名只能包含字母、数字、下划线或点");
           setLoading(false);
           return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, form.password);
        await updateProfile(userCredential.user, { displayName: form.username });
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, loginEmail, form.password);
      }
    } catch (err) {
      console.error(err);
      let msg = "操作失败，请重试";
      if (err.code === 'auth/email-already-in-use') msg = "该用户名已被注册";
      if (err.code === 'auth/wrong-password') msg = "密码错误，请检查密码是否正确";
      if (err.code === 'auth/user-not-found') msg = "账号不存在，请检查用户名或邮箱是否正确";
      if (err.code === 'auth/invalid-email') msg = "邮箱格式不正确";
      if (err.code === 'auth/weak-password') msg = "密码太弱，请至少输入6位";
      if (err.code === 'auth/user-disabled') msg = "账号已被禁用，请联系管理员";
      if (err.code === 'auth/too-many-requests') msg = "登录失败次数过多，请稍后再试或通过忘记密码重置";
      if (err.code === 'auth/network-request-failed') msg = "网络连接失败，请检查网络设置";
      if (err.code === 'auth/internal-error') msg = "系统内部错误，请稍后重试";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 处理忘记密码发送邮件
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!resetEmail.includes('@')) {
        setError("请输入正确的真实邮箱地址");
        setLoading(false);
        return;
    }

    try {
        await sendPasswordResetEmail(auth, resetEmail);
        setSuccessMsg("密码重置邮件已发送！请前往您的个人邮箱查收并重置密码。");
        setResetEmail('');
    } catch (err) {
        console.error(err);
        let msg = "发送失败，请稍后重试";
        if (err.code === 'auth/user-not-found') msg = "该邮箱尚未绑定任何系统账号";
        if (err.code === 'auth/invalid-email') msg = "邮箱格式不正确";
        setError(msg);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      {/* 左侧介绍区域 - 保持不变 */}
      <div className="hidden lg:flex flex-[0_0_58%] bg-slate-900 text-white flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-black opacity-90 z-0"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500 rounded-full blur-[100px] opacity-20"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
              <LayoutDashboard size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">每日计划系统</h1>
          </div>
          
          <h2 className="text-5xl font-bold leading-tight mb-8">
            规划生活，<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              掌控你的身体与时间。
            </span>
          </h2>

          <div className="space-y-8 text-slate-300">
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><Calendar size={24} /></div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">任务计划 (Cloud)</h3>
                <p className="opacity-70 leading-relaxed">基于云端的实时任务看板。无论在手机还是电脑，随时随地管理您的待办事项。</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Activity size={24} /></div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">体重管理 (WeightGuard)</h3>
                <p className="opacity-70 leading-relaxed">科学的卡路里追踪与体重分析系统。自动生成饮食建议，可视化您的减重进度。</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-16 text-slate-500 text-xs">
          © 2026 DailyPlan System. All data encrypted and stored on Cloud.
        </div>
      </div>

      {/* 右侧登录/注册/重置区域 */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 lg:p-12 relative">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4">
          
          {/* ========== 忘记密码视图 ========== */}
          {view === 'forgot' ? (
            <>
              <div className="text-center lg:text-left">
                <button 
                  onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }} 
                  className="mb-4 text-sm text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={16}/> 返回登录
                </button>
                <h2 className="text-3xl font-bold text-slate-900">找回密码</h2>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                  如果您在个人中心绑定过真实邮箱，请输入它。我们将向该邮箱发送一封包含密码重置链接的邮件。
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">已绑定的个人邮箱</label>
                  <div className="relative">
                    <input 
                      required 
                      type="email" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                      placeholder="如: yourname@qq.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                    />
                    <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                    <ShieldCheck size={16} className="shrink-0" /> {error}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-start gap-2 border border-green-200">
                    <ShieldCheck size={16} className="shrink-0 mt-0.5" /> {successMsg}
                  </div>
                )}

                <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2">
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  发送重置邮件
                </button>
              </form>
            </>
          ) : (
            /* ========== 登录 / 注册视图 ========== */
            <>
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900">{view === 'register' ? '创建账号' : '欢迎回来'}</h2>
                <p className="text-slate-500 mt-2">
                  {view === 'register' ? '只需设置用户名和密码即可开始' : '使用用户名或已绑定的邮箱登录'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    {view === 'register' ? '用户名 (英文/数字)' : '用户名 或 绑定的邮箱'}
                  </label>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                      placeholder={view === 'register' ? "设置一个登录名" : "输入用户名或完整邮箱"}
                      value={form.username}
                      onChange={e => setForm({...form, username: e.target.value})}
                      autoComplete="username"
                    />
                    <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  </div>
                  {view === 'register' && (
                    <p className="text-xs text-slate-400 mt-1 ml-1">支持字母、数字、下划线，注册后可绑定真实邮箱</p>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-bold text-slate-700">密码</label>
                    {view === 'login' && (
                      <button 
                        type="button"
                        onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline"
                      >
                        忘记密码？
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      required 
                      type={showPassword ? "text" : "password"} 
                      className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      autoComplete="current-password"
                    />
                    <ShieldCheck className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md hover:bg-slate-100"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 animate-in fade-in">
                    <ShieldCheck size={16} className="shrink-0" /> {error}
                  </div>
                )}

                <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-2">
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  {view === 'register' ? '立即注册' : '登录系统'}
                </button>
              </form>

              <div className="text-center pt-4">
                <button 
                  onClick={() => { 
                    setView(view === 'login' ? 'register' : 'login'); 
                    setError(''); 
                    setForm({username:'', password:''}); 
                    setShowPassword(false);
                  }} 
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline transition"
                >
                  {view === 'login' ? '没有账号？创建新账号' : '已有账号？去登录'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}