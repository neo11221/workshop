
import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Sparkles, CheckCircle, ChevronRight, Medal, Flame, Star, Target, Clock } from 'lucide-react';
import { UserProfile, RankTitle, Mission, MissionSubmission } from '../types';
import { RANKS } from '../constants';
import { getEncouragement } from '../services/geminiService';
import { subscribeToMissions, subscribeToMissionSubmissions, submitMission, hasCompletedMission } from '../utils/storage';
import { useAlert } from './AlertProvider';

interface DashboardProps {
  user: UserProfile;
  rank: RankTitle;
  onUserUpdate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, rank, onUserUpdate }) => {
  const { showAlert } = useAlert();
  const [message, setMessage] = useState('正在獲取導師的建議...');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());

  const nextRank = RANKS[RANKS.indexOf(rank) + 1] || null;
  const progress = nextRank
    ? Math.min(100, ((user.totalEarned - rank.threshold) / (nextRank.threshold - rank.threshold)) * 100)
    : 100;

  useEffect(() => {
    const fetchContent = async () => {
      const msg = await getEncouragement(user, rank);
      setMessage(msg);
    };
    fetchContent();

    // Subscribe to real-time missions updates
    const unsubscribeMissions = subscribeToMissions(async (allMissions) => {
      // Filter only active missions
      const activeMissions = allMissions.filter(m => m.isActive);
      setMissions(activeMissions);

      // Check completion status for all active missions from HISTORY
      const statusSet = new Set<string>();
      for (const m of activeMissions) {
        const isCompleted = await hasCompletedMission(user.id, m.id);
        if (isCompleted) statusSet.add(m.id);
      }
      setCompletedMissionIds(statusSet);
    });

    const unsubscribeSubmissions = subscribeToMissionSubmissions((allSubmissions) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSubmissions(allSubmissions.filter(s => s.userId === user.id && s.timestamp >= today.getTime()));
    });

    return () => {
      unsubscribeMissions();
      unsubscribeSubmissions();
    };
  }, [user.id, rank]);

  const handleCompleteMission = async (mission: Mission) => {
    if (completingId) return;

    // Check if expired
    if (mission.deadline && mission.deadline < Date.now()) {
      showAlert('此任務已截止，無法再提交。', 'error');
      return;
    }

    // Check if already submitted today
    const alreadySubmittedToday = submissions.some(s => s.missionId === mission.id && s.status === 'pending');
    if (alreadySubmittedToday) {
      showAlert('今天已經提交過這個任務囉，請等待導師審核！', 'info');
      return;
    }

    setCompletingId(mission.id);

    try {
      await submitMission({
        id: `sub_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        missionId: mission.id,
        missionTitle: mission.title,
        points: mission.points,
        timestamp: Date.now(),
        status: 'pending'
      });
      showAlert('任務提交成功！請靜候導師審核。', 'success');
    } catch (error) {
      console.error("Error submitting mission:", error);
      showAlert('提交失敗，請檢查網路連線。', 'error');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">哈囉，{user.name}！</h1>
          <p className="text-slate-500 mt-1 italic max-w-xl font-medium">"{message}"</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-3 self-end md:self-start shadow-sm">
          <div className="bg-amber-500 p-2 rounded-xl text-white shadow-lg shadow-amber-200">
            <Medal size={20} />
          </div>
          <div>
            <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">榮耀總累積</p>
            <p className="text-2xl font-black text-amber-900 leading-none">{user.totalEarned.toLocaleString()} <span className="text-xs font-bold opacity-60">PTS</span></p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">當前成就階級</h3>
              <div className="flex items-center gap-4">
                <span className="text-4xl filter drop-shadow-md">{rank.icon}</span>
                <span className={`text-2xl font-black px-6 py-2 rounded-2xl text-white ${rank.color} shadow-xl shadow-indigo-100 border-2 border-white/20`}>
                  {rank.name}
                </span>
              </div>
            </div>
            {nextRank && (
              <div className="text-right">
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">下一個里程碑</h3>
                <div className="flex items-center gap-3 justify-end group">
                  <span className="text-lg font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{nextRank.name}</span>
                  <span className="text-2xl animate-bounce">{nextRank.icon}</span>
                </div>
              </div>
            )}
          </div>

          <div className="relative pt-12 pb-6 px-2">
            <div className="h-5 bg-slate-100 rounded-full w-full overflow-hidden border border-slate-200 shadow-inner p-1">
              <div
                className={`h-full ${rank.color} transition-all duration-1000 ease-out rounded-full relative overflow-hidden`}
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            <div
              className="absolute top-0 transition-all duration-1000 ease-out"
              style={{ left: `calc(${progress}% - 30px)` }}
            >
              <div className="relative group cursor-pointer">
                <div className="p-1.5 bg-white rounded-full shadow-2xl border border-slate-50 transition-transform group-hover:scale-110 active:scale-95">
                  <img
                    src={user.avatar}
                    className={`w-14 h-14 rounded-full border-4 border-opacity-30 object-cover ${rank.color.replace('bg-', 'border-')}`}
                    alt="me"
                  />
                </div>
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-xl text-[11px] font-black text-white shadow-xl ${rank.color} whitespace-nowrap`}>
                  進度 {Math.round(progress)}%
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 font-bold mt-8 tracking-wide">
            {nextRank
              ? `再接再厲！距離晉升「${nextRank.name}」還差 ${nextRank.threshold - user.totalEarned} 點！`
              : '極致境界！您已經是這片森林裡最強大的學習大師！'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-300 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>

          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-6 border border-white/20 shadow-xl">
            <TrendingUp size={40} className="text-white drop-shadow-md" />
          </div>
          <h3 className="text-indigo-200 text-sm font-black mb-1 uppercase tracking-widest">目前可用點數</h3>
          <p className="text-6xl font-black mb-4 drop-shadow-lg">{user.points.toLocaleString()}</p>
          <div className="px-5 py-1.5 bg-indigo-500/40 backdrop-blur rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-white/10">
            SHOPPING POWER
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Target className="text-indigo-500" size={28} />
            今日學習挑戰分級
          </h2>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> 多重倍率獎勵</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {missions.map(mission => {
            const isCompleted = completedMissionIds.has(mission.id);
            return (
              <div
                key={mission.id}
                className={`bg-white border-2 border-slate-50 p-8 rounded-[2.5rem] transition-all group relative overflow-hidden ${isCompleted ? 'opacity-60 grayscale' : 'shadow-sm hover:shadow-xl'
                  } ${mission.id === completingId ? 'animate-pulse' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex gap-8 items-start">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-inner ${mission.type === 'normal' ? 'bg-emerald-50 text-emerald-600' :
                      mission.type === 'challenge' ? 'bg-orange-50 text-orange-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                      {isCompleted ? <CheckCircle size={36} /> : (
                        mission.type === 'normal' ? <Target size={36} /> :
                          mission.type === 'challenge' ? <Flame size={36} /> :
                            <Trophy size={36} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${mission.type === 'normal' ? 'bg-emerald-100 text-emerald-700' :
                          mission.type === 'challenge' ? 'bg-orange-100 text-orange-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                          {mission.type === 'normal' ? '一般任務' : mission.type === 'challenge' ? '挑戰任務' : '困難任務'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 transition-colors">{mission.title}</h3>
                      <p className="text-slate-500 mt-2 leading-relaxed text-lg font-medium max-w-2xl">{mission.description}</p>
                      {mission.deadline && (
                        <div className={`mt-3 flex items-center gap-2 text-sm font-black ${mission.deadline < Date.now() ? 'text-rose-500' : 'text-amber-500'}`}>
                          <Clock size={16} />
                          {mission.deadline < Date.now() ? '任務已截止' : `截止於 ${new Date(mission.deadline).toLocaleString()}`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-6 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tighter">完成獎勵點數</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-indigo-600 tracking-tighter">
                          {mission.points}
                        </span>
                        <span className="text-sm font-bold text-slate-400">PTS</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteMission(mission)}
                      disabled={
                        completingId !== null ||
                        isCompleted ||
                        submissions.some(s => s.missionId === mission.id && s.status === 'pending') ||
                        (mission.deadline !== undefined && mission.deadline < Date.now())
                      }
                      className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center gap-3 shadow-xl ${isCompleted
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                        : submissions.some(s => s.missionId === mission.id && s.status === 'pending')
                          ? 'bg-amber-100 text-amber-600 cursor-not-allowed shadow-none'
                          : (mission.deadline !== undefined && mission.deadline < Date.now())
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : (mission.type === 'normal' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' :
                              mission.type === 'challenge' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' :
                                'bg-rose-600 hover:bg-rose-700 shadow-rose-100')
                        } text-white text-lg active:scale-95 disabled:active:scale-100`}
                    >
                      {isCompleted
                        ? '已完成'
                        : submissions.some(s => s.missionId === mission.id && s.status === 'pending')
                          ? '審核中'
                          : (mission.deadline !== undefined && mission.deadline < Date.now())
                            ? '已截止'
                            : completingId === mission.id
                              ? '提交結果中...'
                              : '提交任務結果'}
                      {!isCompleted && !submissions.some(s => s.missionId === mission.id && s.status === 'pending') && (!mission.deadline || mission.deadline >= Date.now()) && <ChevronRight size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
