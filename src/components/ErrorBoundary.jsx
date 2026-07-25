/**
 * 错误边界组件
 * 优雅处理组件错误，显示友好提示，支持重试
 */

import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Code2 } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallback } = this.props;

      // 如果提供了自定义fallback，使用它
      if (fallback) {
        return fallback({ 
          error, 
          errorInfo, 
          onRetry: this.handleRetry 
        });
      }

      // 默认错误页面
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full text-center">
            {/* 错误图标 */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle size={40} className="text-red-500" />
            </div>

            {/* 错误标题 */}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              页面出现错误
            </h2>

            {/* 错误描述 */}
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              抱歉，页面加载时出现了问题。请尝试刷新页面。
            </p>

            {/* 错误详情（可折叠） */}
            <div className="mb-6">
              <details className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
                  <Code2 size={14} />
                  查看错误详情
                </summary>
                <div className="px-4 py-4 bg-slate-50 dark:bg-slate-800/50">
                  <pre className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {error?.toString()}
                    {errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                <RefreshCw size={18} />
                刷新页面
              </button>
              <button
                onClick={() => {
                  if (window.location.pathname !== '/') {
                    window.location.href = '/';
                  } else {
                    this.handleRetry();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Home size={18} />
                返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 模块错误边界组件
 * 用于单个模块的错误处理
 */
const ModuleErrorBoundary = ({ children, title = '模块' }) => (
  <ErrorBoundary
    fallback={({ error, onRetry }) => (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          {title}加载失败
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {error?.toString() || '遇到未知错误'}
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all"
        >
          <RefreshCw size={16} />
          重试
        </button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

export { ErrorBoundary, ModuleErrorBoundary };
