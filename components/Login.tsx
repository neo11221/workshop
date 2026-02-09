import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { getStudents, registerStudent, ADMIN_USER, GUEST_USER, saveUser } from '../utils/storage';
import { Zap, ShieldCheck, User, UserPlus, Eye } from 'lucide-react';
import { useAlert } from './AlertProvider';
import { GRADES } from '../constants';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

interface LoginProps {
    onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const { showAlert } = useAlert();
    const [role, setRole] = useState<'student' | 'admin' | 'guest'>('student');
    const [isRegistering, setIsRegistering] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [grade, setGrade] = useState('七年級');
    const [adminPass, setAdminPass] = useState('');
    const [guestCode, setGuestCode] = useState('');

    const handleStudentLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // 1. 先獲取學生列表 (需要 Firestore 規則允許 public read)
            const students = await getStudents();
            const user = students.find(s => s.name === name);

            if (!user) {
                showAlert('找不到此用戶，請先註冊。', 'error');
                return;
            }

            if (!user.isApproved) {
                showAlert('您的帳號尚在審核中，請待導師核准。', 'info');
                return;
            }

            // 2. 嘗試 Firebase 登入
            // Email 格式: [id]@workshop.local
            const email = `${user.id}@workshop.local`;
            await signInWithEmailAndPassword(auth, email, password);

            // 3. 登入成功，儲存 session
            await saveUser(user);
            showAlert('登入成功！', 'success');
            onLogin(user);

        } catch (error: any) {
            console.error('Login error:', error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                showAlert('密碼錯誤 (或是帳號尚未建立)。', 'error');
            } else if (error.code === 'auth/user-not-found') {
                showAlert('尚未建立登入帳號，請聯繫導師。', 'error');
            } else {
                showAlert(`登入失敗: ${error.message}`, 'error');
            }
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await registerStudent(name, password, grade);
        if (success) {
            showAlert('註冊申請已送出！請通知導師審核並建立帳號。', 'success');
            setIsRegistering(false);
            setPassword('');
        } else {
            showAlert('該名稱已被使用。', 'error');
        }
    };

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        // 原本: if (adminPass === '0957999')
        if (adminPass === '0957999') {
            // 為了相容舊習慣，如果輸入的是舊密碼 0957999，我們嘗試用預設管理員帳號登入
            try {
                await signInWithEmailAndPassword(auth, 'admin@workshop.local', '0957999');
                saveUser(ADMIN_USER);
                showAlert('管理員登入成功！', 'success');
                onLogin(ADMIN_USER);
            } catch (error: any) {
                // 如果 admin@workshop.local 沒建立，就 fallback?
                // 不，強迫要建立。
                showAlert('管理員帳號尚未建立 (admin@workshop.local)', 'error');
            }
        } else {
            // 也可以允許直接輸入 email? 不，介面只有 password。
            // 假設管理員都用 admin@workshop.local
            try {
                // 嘗試把輸入當作密碼
                await signInWithEmailAndPassword(auth, 'admin@workshop.local', adminPass);
                saveUser(ADMIN_USER);
                showAlert('管理員登入成功！', 'success');
                onLogin(ADMIN_USER);
            } catch (error) {
                showAlert('管理員密碼錯誤', 'error');
            }
        }
    };

    const handleGuestLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (guestCode.toLowerCase() === 'aaa') {
            try {
                await signInAnonymously(auth);
                saveUser(GUEST_USER);
                showAlert('訪客登入成功！', 'success');
                onLogin(GUEST_USER);
            } catch (error: any) {
                console.error('Guest login error:', error);
                if (error.code === 'auth/admin-restricted-operation') {
                    showAlert('訪客登入未啟用，請在 Console 開啟 Anonymous。', 'error');
                } else {
                    showAlert('訪客登入失敗', 'error');
                }
            }
        } else {
            showAlert('訪客代碼錯誤', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
            <div className="bg-white max-w-4xl w-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Left Side: Illustration / Brand */}
                <div className="bg-indigo-600 p-12 text-white md:w-5/12 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full -translate-y-1/2 translate-x-1/3 opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-700 rounded-full translate-y-1/3 -translate-x-1/3 opacity-50"></div>

                    <div className="relative z-10">
                        <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center p-2 mb-6 shadow-xl">
                            <img src="/wenhong_cramschool/wenhong_logo.jpg" className="w-full h-full rounded-xl object-cover" alt="logo" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-4">文宏學習工坊</h1>
                        <p className="text-indigo-100 font-medium text-lg leading-relaxed">紀錄你的每一個成長軌跡，兌換屬於你的榮耀。</p>
                    </div>

                    <div className="relative z-10 text-sm font-medium text-indigo-200">
                        © 2026 Workshop System
                    </div>
                </div>

                {/* Right Side: Forms */}
                <div className="p-8 md:p-12 md:w-7/12 flex flex-col">

                    {/* Role Switcher */}
                    {!isRegistering && (
                        <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
                            <button
                                onClick={() => setRole('student')}
                                className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-1 ${role === 'student' ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500 ring-offset-2' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                <User size={18} /> 學生
                            </button>
                            <button
                                onClick={() => setRole('admin')}
                                className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-1 ${role === 'admin' ? 'bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500 ring-offset-2' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                <ShieldCheck size={18} /> 導師
                            </button>
                            <button
                                onClick={() => setRole('guest')}
                                className={`flex-1 min-w-[100px] py-3 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-1 ${role === 'guest' ? 'bg-indigo-50 text-indigo-600 ring-2 ring-500 ring-offset-2' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                                <Eye size={18} /> 訪客
                            </button>
                        </div>
                    )}

                    {/* Student Login */}
                    {!isRegistering && role === 'student' && (
                        <form onSubmit={handleStudentLogin} className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 mb-1">學生登入</h2>
                                <p className="text-slate-400">歡迎回來！準備好開始學習了嗎？</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">姓名</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        placeholder="請輸入你的名字"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">密碼</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95">
                                登入系統
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={() => setIsRegistering(true)} className="text-indigo-500 font-bold hover:underline">
                                    還沒有帳號？立即註冊
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Student Register */}
                    {isRegistering && (
                        <form onSubmit={handleRegister} className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 mb-1">學生註冊</h2>
                                <p className="text-slate-400">建立資料，開始累積點數！</p>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">姓名</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        placeholder="請輸入你的名字"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">密碼</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                        placeholder="設定一組密碼"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">年級</label>
                                    <select
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all appearance-none"
                                    >
                                        {GRADES.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                                <UserPlus size={20} />
                                送出申請
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={() => setIsRegistering(false)} className="text-slate-400 font-bold hover:text-slate-600">
                                    返回登入
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Admin Login */}
                    {!isRegistering && role === 'admin' && (
                        <form onSubmit={handleAdminLogin} className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 mb-1">導師登入</h2>
                                <p className="text-slate-400">請輸入管理密碼進入後台。</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">密碼</label>
                                <input
                                    type="password"
                                    value={adminPass}
                                    onChange={e => setAdminPass(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="輸入管理密碼..."
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95">
                                進入管理後台
                            </button>
                        </form>
                    )}

                    {/* Guest Login */}
                    {!isRegistering && role === 'guest' && (
                        <form onSubmit={handleGuestLogin} className="space-y-6 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 mb-1">訪客模式</h2>
                                <p className="text-slate-400">僅供瀏覽，無法進行兌換。</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">訪客代碼</label>
                                <input
                                    type="text"
                                    value={guestCode}
                                    onChange={e => setGuestCode(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="輸入訪客代碼..."
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95">
                                開始瀏覽
                            </button>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Login;
