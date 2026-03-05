// @ts-nocheck
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 border border-zinc-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-zinc-900">Aplikasi Terhenti</h1>
              <p className="text-zinc-500 font-medium">Terjadi kesalahan sistem yang tidak terduga.</p>
            </div>
            <div className="p-4 bg-zinc-50 rounded-2xl text-left overflow-auto max-h-40">
              <code className="text-xs text-red-600 font-mono break-all">
                {this.state.error?.message || 'Unknown error'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:scale-105 transition-all uppercase tracking-widest text-xs"
            >
              Muat Ulang Aplikasi
            </button>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              Jika masalah berlanjut, hubungi admin
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
