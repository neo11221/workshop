
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                    <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-red-100">
                        <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-100 animate-pulse">
                            <AlertTriangle className="text-red-500" size={40} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 mb-4">哎呀！系統出了點小狀況</h1>
                        <p className="text-slate-500 mb-10 leading-relaxed font-medium">
                            請別擔心，您的數據通常是安全的。這可能是一個暫時性的網路問題。
                        </p>

                        {/* 錯誤細節 (僅開發或除錯參考) */}
                        {this.state.error && (
                            <div className="mb-8 p-4 bg-slate-50 rounded-2xl text-[10px] font-mono text-slate-400 overflow-auto max-h-32 text-left border border-slate-100 italic">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
                        >
                            <RefreshCcw size={24} />
                            重新整理頁面
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
