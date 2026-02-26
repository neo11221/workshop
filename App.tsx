
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  History,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Trophy,
  Zap,
  UserCircle,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react';
import Settings from './components/Settings';
import { UserProfile, RankTitle, UserRole } from './types';
import { getUser, saveUser, getStudents, logoutUser } from './utils/storage';
import { RANKS } from './constants';
import Dashboard from './components/Dashboard';
import Shop from './components/Shop';
import Redemptions from './components/Redemptions';
import Admin from './components/Admin';
import WishingWell from './components/WishingWell';
import Login from './components/Login';

const Navigation = ({ user, currentRank, onSwitchUser }: { user: UserProfile, currentRank: RankTitle, onSwitchUser: () => void }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { path: '/', label: '總覽', icon: LayoutDashboard },
    { path: '/shop', label: '點數商城', icon: ShoppingBag },
    { path: '/wishes', label: '許願池', icon: Sparkles },
    { path: '/history', label: '兌換紀錄', icon: History },
  ];

  if (user.role === UserRole.ADMIN) {
    links.push({ path: '/admin', label: '管理後台', icon: ShieldCheck });
  }

  return (
    <nav className="bg-white border-r border-slate-200 w-full md:w-64 md:fixed md:inset-y-0 h-auto md:h-full z-50 shadow-sm">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/wenhong_cramschool/wenhong_logo.jpg" className="w-8 h-8 rounded-lg shadow-sm object-cover" alt="logo" />
          <span className="text-xl font-bold text-slate-800 tracking-tight">文宏學習工坊</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-slate-600">
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:block p-4 space-y-2`}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
                }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:block absolute bottom-0 w-full p-6 border-t border-slate-100 bg-white`}>
        <div className="flex items-center gap-3 mb-4">
          <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-slate-100 object-cover" alt="avatar" />
          <div className="overflow-hidden">
            <p className="font-bold text-slate-800 truncate text-sm">{user.name}</p>
            <div className={`text-[9px] px-2 py-0.5 rounded-full inline-block text-white font-black ${currentRank.color}`}>
              {currentRank.icon} {currentRank.name} Lv.{Math.floor(user.totalEarned / 500) + 1}
            </div>
          </div>
        </div>
        <button
          onClick={onSwitchUser}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors text-xs font-bold w-full bg-indigo-50 p-2 rounded-lg justify-center mb-2"
        >
          <LogOut size={14} />
          <span>登出系統</span>
        </button>
        <Link
          to="/settings"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-xs font-bold w-full p-2 justify-center"
        >
          <SettingsIcon size={14} />
          <span>個人設定</span>
        </Link>
      </div>
    </nav>
  );
};


import { AlertProvider } from './components/AlertProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { subscribeToStudent, saveUserSession } from './utils/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(getUser());

  useEffect(() => {
    if (!user || user.role !== UserRole.STUDENT) return;

    console.log(`[Sync] Starting real-time listener for student: ${user.name} (${user.id})`);

    // Listen for real-time updates to the student's profile
    const unsub = subscribeToStudent(user.id, (updatedUser) => {
      setUser(prev => {
        if (!prev) return updatedUser;

        // Only update if critical data changed to prevent unnecessary re-renders
        if (updatedUser.points !== prev.points ||
          updatedUser.totalEarned !== prev.totalEarned ||
          updatedUser.isApproved !== prev.isApproved) {

          console.log(`[Sync] Point update detected: ${prev.points} -> ${updatedUser.points}`);
          saveUserSession(updatedUser); // Update local storage ONLY (avoid loop)
          return updatedUser;
        }
        return prev;
      });
    });

    return () => {
      console.log(`[Sync] Cleaning up listener for ${user.id}`);
      unsub();
    };
  }, [user?.id]);

  const currentRank = user ? RANKS.reduce((prev, curr) => {
    if (user.totalEarned >= curr.threshold) return curr;
    return prev;
  }, RANKS[0]) : RANKS[0];

  const refreshUser = () => {
    const u = getUser();
    if (u) setUser(u);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <AlertProvider>
        {!user ? (
          <Login onLogin={setUser} />
        ) : (
          <HashRouter>
            <div className="min-h-screen flex flex-col md:flex-row bg-[#fbfcfd]">
              <Navigation user={user} currentRank={currentRank} onSwitchUser={handleLogout} />

              <main className="flex-1 md:ml-64 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard user={user} rank={currentRank} onUserUpdate={refreshUser} />} />
                    <Route path="/shop" element={<Shop user={user} onUserUpdate={refreshUser} />} />
                    <Route path="/wishes" element={<WishingWell user={user} onUserUpdate={refreshUser} />} />
                    <Route path="/history" element={<Redemptions user={user} />} />
                    <Route path="/admin" element={user.role === UserRole.ADMIN ? <Admin onRefresh={refreshUser} /> : <Navigate to="/" replace />} />
                    <Route path="/settings" element={<Settings user={user} onUserUpdate={refreshUser} />} />
                  </Routes>
                </div>
              </main>
            </div>
          </HashRouter>
        )}
      </AlertProvider>
    </ErrorBoundary>
  );
};

export default App;
