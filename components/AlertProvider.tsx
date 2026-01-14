import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AlertContextType {
    showAlert: (message: string, type?: 'success' | 'error' | 'info') => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlert({ message, type });
    };

    const hideAlert = () => {
        setAlert(null);
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert && (
                <AlertModal
                    message={alert.message}
                    type={alert.type}
                    onClose={hideAlert}
                />
            )}
        </AlertContext.Provider>
    );
};

// Internal Modal Component
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const AlertModal: React.FC<{
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void
}> = ({ message, type, onClose }) => {
    const iconMap = {
        success: <CheckCircle className="text-emerald-500" size={32} />,
        error: <AlertCircle className="text-rose-500" size={32} />,
        info: <Info className="text-indigo-500" size={32} />
    };

    const bgMap = {
        success: 'bg-emerald-50',
        error: 'bg-rose-50',
        info: 'bg-indigo-50'
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="flex flex-col items-center text-center">
                    <div className={`${bgMap[type]} p-4 rounded-2xl mb-6`}>
                        {iconMap[type]}
                    </div>

                    <h3 className="text-xl font-black text-slate-800 mb-2">文宏補習班</h3>
                    <p className="text-slate-500 font-bold leading-relaxed mb-8">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        我知道了
                    </button>
                </div>
            </div>
        </div>
    );
};
