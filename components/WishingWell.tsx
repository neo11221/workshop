import React, { useState, useEffect } from 'react';
import { Heart, Plus, Sparkles, Send, X, ThumbsUp } from 'lucide-react';
import { UserProfile, Wish } from '../types';
import { subscribeToWishes, addWish, likeWish, updateWish, saveStudent } from '../utils/storage';
import { useAlert } from './AlertProvider';
import { Clock, Coins } from 'lucide-react';

const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

interface WishingWellProps {
    user: UserProfile;
    onUserUpdate: () => void;
}

const WishingWell: React.FC<WishingWellProps> = ({ user, onUserUpdate }) => {
    const { showAlert } = useAlert();
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

    const userLastWish = wishes.filter(w => w.userId === user.id).sort((a, b) => b.timestamp - a.timestamp)[0];
    const isOnCooldown = userLastWish && (Date.now() - userLastWish.timestamp < COOLDOWN_MS);

    useEffect(() => {
        // Subscribe to real-time wishes updates
        const unsubscribe = subscribeToWishes((updatedWishes) => {
            setWishes(updatedWishes.sort((a, b) => b.timestamp - a.timestamp));
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!userLastWish) return null;

            const diff = (userLastWish.timestamp + COOLDOWN_MS) - Date.now();
            if (diff <= 0) return null;

            return {
                d: Math.floor(diff / (1000 * 60 * 60 * 24)),
                h: Math.floor((diff / (1000 * 60 * 60)) % 24),
                m: Math.floor((diff / 1000 / 60) % 60),
                s: Math.floor((diff / 1000) % 60)
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [userLastWish]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName.trim() || !description.trim()) return;

        const newWish: Wish = {
            id: `wish_${Date.now()}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            itemName: itemName,
            description: description,
            timestamp: Date.now(),
            likedBy: []
        };

        await addWish(newWish);
        setIsAdding(false);
        setItemName('');
        setDescription('');
        showAlert('許願成功！點擊頭像旁的愛心可以互相集氣喔！', 'success');
    };

    const handleLike = async (wishId: string, likedBy: string[] | undefined) => {
        if (likedBy?.includes(user.id)) {
            showAlert('你已經幫這個願望集過氣囉！', 'info');
            return;
        }
        await likeWish(wishId, user.id);
    };

    const handleResetCooldown = async () => {
        if (user.points < 1000) {
            showAlert('點數不足！需要 1000 點才能重置冷卻喔。', 'error');
            return;
        }

        if (confirm('確定要花費 1000 點重置冷卻時間嗎？')) {
            try {
                // 1. Deduct points
                const updatedUser = { ...user, points: user.points - 1000 };
                await saveStudent(updatedUser);

                // 2. Reset last wish timestamp (set to 31 days ago)
                if (userLastWish) {
                    await updateWish(userLastWish.id, {
                        timestamp: Date.now() - (COOLDOWN_MS + 100000)
                    });
                }

                showAlert('冷卻已重置！可以再次許願了。', 'success');
                onUserUpdate();
            } catch (error) {
                showAlert('重置失敗，請稍後再試。', 'error');
            }
        }
    };



    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Sparkles className="text-yellow-500" />
                        許願池
                    </h1>
                    <p className="text-slate-500 mt-1">想要什麼獎勵？大聲告訴導師吧！</p>
                </div>
                <button
                    onClick={() => {
                        if (isOnCooldown) {
                            showAlert(`冷卻中！請等待倒數結束再許下下個願望。`, 'info');
                        } else {
                            setIsAdding(true);
                        }
                    }}
                    className={`px-6 py-3 rounded-2xl font-black shadow-lg flex flex-col items-center gap-1 transition-all hover:scale-105 min-w-[200px] ${isOnCooldown ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}
                >
                    <div className="flex items-center gap-2">
                        {isOnCooldown ? <Clock size={18} /> : <Plus size={20} />}
                        <span>{isOnCooldown ? '冷卻中' : '我要許願'}</span>
                    </div>
                    {isOnCooldown && timeLeft && (
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold font-mono tracking-tight">
                                {timeLeft.d}天 {timeLeft.h}時 {timeLeft.m}分 {timeLeft.s}秒
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleResetCooldown();
                                }}
                                className="mt-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 hover:bg-amber-200 transition-colors shadow-sm"
                            >
                                <Coins size={10} />
                                1000 PTS 重置
                            </button>
                        </div>
                    )}
                </button>
            </header>

            {/* Wish List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishes.map((wish) => (
                    <div key={wish.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
                        {/* Decor */}
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 rounded-full blur-2xl group-hover:bg-yellow-100 transition-colors"></div>

                        <div className="flex items-center gap-3 mb-4 z-10">
                            <img src={wish.userAvatar} alt={wish.userName} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                            <div>
                                <p className="text-sm font-bold text-slate-700">{wish.userName}</p>
                                <p className="text-xs text-slate-400">{new Date(wish.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-2 z-10">{wish.itemName}</h3>
                        <p className="text-slate-500 text-sm mb-6 flex-1 z-10">{wish.description}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 z-10">
                            <button
                                onClick={() => handleLike(wish.id, wish.likedBy)}
                                className={`flex items-center gap-2 transition-colors group/like ${wish.likedBy?.includes(user.id) ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
                            >
                                <div className={`p-2 rounded-full transition-colors ${wish.likedBy?.includes(user.id) ? 'bg-pink-50' : 'hover:bg-pink-50'}`}>
                                    <ThumbsUp size={18} className={wish.likedBy?.includes(user.id) ? "fill-pink-500" : ""} />
                                </div>
                                <span className="font-bold text-sm">{wish.likedBy?.length || 0} 集氣</span>
                            </button>
                        </div>
                    </div>
                ))}

                {wishes.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <Heart size={40} />
                        </div>
                        <p className="text-slate-400 font-bold">目前還沒有任何願望，搶先許下第一個願望吧！</p>
                    </div>
                )}
            </div>

            {/* Add Wish Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <Sparkles className="text-indigo-500" />
                                許下新願望
                            </h2>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-slate-700 font-bold mb-2 ml-1">你想要什麼？</label>
                                <input
                                    type="text"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="例如：AirPods Pro、更多點心..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-2 ml-1">為什麼想要這個？</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="描述一下你的想法，讓導師更有動力幫你實現..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all h-32 resize-none placeholder:font-medium"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.25rem] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-lg"
                            >
                                <Send size={24} />
                                送出願望
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WishingWell;
