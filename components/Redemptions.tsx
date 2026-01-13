
import React, { useState, useEffect } from 'react';
import { QrCode, Calendar, Clock, CheckCircle2, AlertCircle, X, History } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Redemption, UserProfile } from '../types';
import { subscribeToRedemptions } from '../utils/storage';

const Redemptions: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [viewingRedemption, setViewingRedemption] = useState<Redemption | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    // 使用實時監聽替代一次性讀取 (getRedemptions is async now)
    const unsubscribe = subscribeToRedemptions((allRedemptions) => {
      setRedemptions(allRedemptions.filter(r => r.userId === user.id));
    });
    return () => unsubscribe();
  }, [user.id]);

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRedemptions = redemptions.filter(r => {
    const d = new Date(r.timestamp);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return m === selectedMonth;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">兌換紀錄</h1>
          <p className="text-slate-500 mt-1">追蹤您的點數去向與商品兌換狀態</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <Calendar size={18} className="text-indigo-600 ml-2" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none bg-transparent font-bold text-slate-600 outline-none p-1"
          />
        </div>
      </header>

      {filteredRedemptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <History size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">尚未有兌換紀錄</h2>
          <p className="text-slate-400 mt-2">快去商城看看有什麼想兌換的吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRedemptions.map(r => (
            <div
              key={r.id}
              className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${r.status === 'completed' ? 'bg-green-50 text-green-600' :
                  r.status === 'pending' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
                  }`}>
                  {r.status === 'completed' ? <CheckCircle2 size={24} /> :
                    r.status === 'pending' ? <Clock size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{r.productName || '未知商品'}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(r.timestamp || Date.now())}</span>
                    <span className="font-bold text-indigo-600">-{r.pointsSpent || 0} 點</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${r.status === 'completed' ? 'bg-green-100 text-green-700' :
                  r.status === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {r.status === 'completed' ? '已核銷' : r.status === 'pending' ? '待領取' : '已取消'}
                </div>
                {r.status === 'pending' && (
                  <button
                    onClick={() => setViewingRedemption(r)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100"
                  >
                    <QrCode size={18} />
                    出示兌換碼
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingRedemption && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] max-w-sm w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-end mb-4 -mt-4 -mr-4">
              <button onClick={() => setViewingRedemption(null)} className="text-slate-400 hover:text-slate-600 p-2">
                <X size={28} />
              </button>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">出示兌換</h2>
            <p className="text-slate-500 mb-8 text-sm">請將此碼向管理員展示進行掃描</p>

            <div className="aspect-square bg-white border-8 border-indigo-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner overflow-hidden p-6">
              <QRCodeSVG
                value={viewingRedemption.qrCodeData}
                size={256}
                level="H"
                includeMargin={false}
                className="w-full h-full"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 font-mono text-xs mb-8 tracking-widest uppercase">
              {viewingRedemption.qrCodeData}
            </div>

            <p className="font-bold text-slate-800 mb-1">{viewingRedemption.productName}</p>
            <p className="text-xs text-slate-400">ID: {viewingRedemption.id}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Redemptions;
