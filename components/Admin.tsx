
import React, { useState, useEffect } from 'react';
import { Camera, ShieldCheck, Check, Search, X, ScanLine, Gift, History as HistoryIcon, GraduationCap, Users, UserPlus, Package, Plus, Target, Clock, Trash2, Heart, CheckCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Redemption, UserProfile, Product, UserRole, Mission, PointReason, Wish, MissionSubmission, ProductCategory } from '../types';
import { updateRedemptionStatus, approveStudent, deleteStudent, addProduct, addMission, toggleMission, saveStudents, subscribeToStudents, subscribeToRedemptions, subscribeToProducts, subscribeToMissions, deleteProduct, addPointReason, deletePointReason, subscribeToPointReasons, subscribeToWishes, deleteWish, subscribeToMissionSubmissions, approveMission, rejectMission, updateProductStock, subscribeToProductCategories, addProductCategory, deleteProductCategory } from '../utils/storage';
import { useAlert } from './AlertProvider';
import { RANKS } from '../constants';

interface AdminProps {
  onRefresh: () => void;
}

const Admin: React.FC<AdminProps> = ({ onRefresh }) => {
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<'roster' | 'scan' | 'points' | 'history' | 'approval' | 'products' | 'missions' | 'wishes' | 'mission_approval'>('roster');
  const [isScanning, setIsScanning] = useState(false);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [pendingStudents, setPendingStudents] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [pointReasons, setPointReasons] = useState<PointReason[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<Redemption | null>(null);
  const redemptionsRef = React.useRef(redemptions);

  React.useEffect(() => {
    redemptionsRef.current = redemptions;
  }, [redemptions]);

  // New Mission States
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionPoints, setNewMissionPoints] = useState('');
  const [newMissionType, setNewMissionType] = useState<'normal' | 'challenge' | 'hard'>('normal');
  const [newMissionDeadline, setNewMissionDeadline] = useState('');
  const [isAddingMission, setIsAddingMission] = useState(false);

  // 點數管理相關狀態
  const [targetStudentId, setTargetStudentId] = useState<string>('');
  const [pointAmount, setPointAmount] = useState<string>('100');
  const [reason, setReason] = useState('考試成績優異');
  const [newReason, setNewReason] = useState('');
  const [isAddingReason, setIsAddingReason] = useState(false);

  // 商品管理
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<string>('');
  const [newProductImage, setNewProductImage] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // 分類管理
  const [newCatName, setNewCatName] = useState('');
  const [isManagingCats, setIsManagingCats] = useState(false);

  useEffect(() => {
    // Subscribe to all data with real-time updates
    const unsubStudents = subscribeToStudents((allStudents) => {
      setStudents(allStudents.filter(s => s.role === UserRole.STUDENT && s.isApproved));
      setPendingStudents(allStudents.filter(s => s.role === UserRole.STUDENT && !s.isApproved));

      // Set default student for points tab
      const approved = allStudents.filter(s => s.role === UserRole.STUDENT && s.isApproved);
      if (approved.length > 0 && !targetStudentId) {
        setTargetStudentId(approved[0].id);
      }
    });

    const unsubRedemptions = subscribeToRedemptions(setRedemptions);
    const unsubProducts = subscribeToProducts(setProducts);
    const unsubMissions = subscribeToMissions(setMissions);
    const unsubReasons = subscribeToPointReasons(setPointReasons);
    const unsubWishes = subscribeToWishes(setWishes);
    const unsubSubmissions = subscribeToMissionSubmissions(setSubmissions);
    const unsubCategories = subscribeToProductCategories((allCats) => {
      setCategories(allCats);
      if (allCats.length > 0 && !newProductCategory) {
        setNewProductCategory(allCats[0].name);
      }
    });

    return () => {
      unsubStudents();
      unsubRedemptions();
      unsubProducts();
      unsubMissions();
      unsubReasons();
      unsubWishes();
      unsubSubmissions();
      unsubCategories();
    };
  }, [targetStudentId, newProductCategory]);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    const startScanner = async () => {
      if (activeTab === 'scan') {
        try {
          html5QrCode = new Html5Qrcode("reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              if (decodedText) {
                handleAutoVerify(decodedText);
              }
            },
            () => { }
          );
        } catch (err) {
          console.error("Unable to start scanner", err);
        }
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode?.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [activeTab]);

  const handleAutoVerify = (code: string) => {
    // 如果已經有結果在處理中，不重複觸發
    if (scanResult) return;

    // 立即檢查
    const match = redemptionsRef.current.find(r => r.qrCodeData === code && r.status === 'pending');
    if (match) {
      setScanResult(match);
    }
  };

  const handleStartScan = async (forcedCode?: string) => {
    const codeToVerify = typeof forcedCode === 'string' ? forcedCode : scanInput;

    if (!codeToVerify) {
      showAlert('請輸入代碼或對準攝像頭', 'error');
      return;
    }

    setIsScanning(true);
    setTimeout(() => {
      const match = redemptions.find(r => r.qrCodeData === codeToVerify && r.status === 'pending');

      if (match) {
        setScanResult(match);
        setScanInput('');
      } else {
        showAlert('無效的兌換碼或該商品已核銷', 'error');
      }
      setIsScanning(false);
    }, 800); // 縮短模擬時間
  };

  const handleConfirmRedemption = async (redemptionId: string) => {
    if (scanResult) {
      await updateRedemptionStatus(redemptionId, 'completed');
      setScanResult(null);
      showAlert('核銷成功，獎勵已發放！', 'success');
    }
  };

  const handleIssuePoints = async () => {
    const amount = parseInt(pointAmount);
    if (isNaN(amount) || !targetStudentId) return;

    const targetStudent = students.find(s => s.id === targetStudentId);
    if (!targetStudent) {
      showAlert('找不到目標學生', 'error');
      return;
    }

    const pts = parseInt(pointAmount);
    if (isNaN(pts) || pts <= 0) {
      showAlert('點數必須是正整數', 'error');
      return;
    }

    const updatedStudents = students.map(s => {
      if (s.id === targetStudentId) {
        return {
          ...s,
          points: s.points + amount,
          totalEarned: amount > 0 ? s.totalEarned + amount : s.totalEarned
        };
      }
      return s;
    });

    await saveStudents(updatedStudents);
    onRefresh();
    setStudents(prev => prev.map(s => s.id === targetStudentId ? { ...s, points: s.points + pts } : s));
    setPointAmount('');
    showAlert(`發送成功！已給予 ${targetStudent.name} ${pts} 點。`, 'success');
  };

  const handleApprove = async (id: string) => {
    await approveStudent(id);
    showAlert('已核准學生加入！', 'success');
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要拒絕/刪除此申請嗎？')) {
      await deleteStudent(id);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice || !newProductStock) {
      showAlert('請填寫所有商品資訊', 'error');
      return;
    }

    if (newProductName && newProductPrice) {
      const product: any = {
        id: `prod_${Date.now()}`,
        name: newProductName,
        category: newProductCategory,
        price: parseInt(newProductPrice),
        description: `精選${newProductCategory === 'food' ? '美食' : newProductCategory === 'electronic' ? '電子產品' : newProductCategory === 'ticket' ? '門票' : '商品'}`,
        imageUrl: newProductImage || 'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
        stock: parseInt(newProductStock) || 99
      };
      await addProduct(product);
      setIsAddingProduct(false);
      setNewProductName('');
      setNewProductPrice('');
      setNewProductStock('');
      setNewProductImage('');
      setNewProductCategory('other');
      showAlert('商品上架成功！', 'success');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('確定要刪除此商品嗎？')) {
      await deleteProduct(id);
    }
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle || !newMissionPoints) {
      showAlert('請填寫任務標題和點數', 'error');
      return;
    }

    const newMission: Mission = {
      id: `m_${Date.now()}`,
      title: newMissionTitle,
      description: '由導師新增的挑戰任務',
      points: parseInt(newMissionPoints),
      type: newMissionType,
      isActive: true,
      maxAttempts: 1,
      deadline: newMissionDeadline ? new Date(newMissionDeadline).getTime() : undefined
    };

    await addMission(newMission);
    setIsAddingMission(false);
    setNewMissionTitle('');
    setNewMissionPoints('');
    setNewMissionType('normal');
    setNewMissionDeadline('');
    showAlert('任務發布成功！', 'success');
  };

  const handleDeleteWish = async (id: string) => {
    if (window.confirm('確定要執行備份嗎？（此操作僅為示意）')) {
      showAlert('雲端備份已完成', 'success');
    }
  };

  const handleAddReason = async () => {
    if (!newReason) {
      showAlert('請輸入加分項目名稱', 'error');
      return;
    }
    await addPointReason({
      id: `r_${Date.now()}`,
      title: newReason
    });
    setNewReason('');
    setIsAddingReason(false);
    showAlert('加分項目已新增', 'success');
  };

  const handleDeleteReason = async (id: string) => {
    await deletePointReason(id);
  };

  const handleToggleMission = async (id: string) => {
    await toggleMission(id);
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    await updateProductStock(id, newStock);
    showAlert('庫存更新成功！', 'success');
  };

  const handleApproveMission = async (id: string) => {
    await approveMission(id);
    showAlert('已核准任務，點數已發放！', 'success');
  };

  const handleRejectMission = async (id: string) => {
    if (confirm('確定要拒絕此任務提交嗎？')) {
      await rejectMission(id);
    }
  };

  const filteredRedemptions = redemptions.filter(r => {
    const matchesSearch = (r.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (r.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const redemptionDate = new Date(r.timestamp);
    const redemptionMonth = `${redemptionDate.getFullYear()}-${String(redemptionDate.getMonth() + 1).padStart(2, '0')}`;
    const matchesMonth = redemptionMonth === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  const getRank = (totalEarned: number) => {
    return RANKS.reduce((prev, curr) => {
      if (totalEarned >= curr.threshold) return curr;
      return prev;
    }, RANKS[0]);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100">
              <ShieldCheck size={32} />
            </div>
            管理權限中心
          </h1>
          <p className="text-slate-500 mt-2 italic font-medium">「賦予學生學習動能，即時追蹤成長軌跡。」</p>
        </div>
      </header>

      {/* 功能切換導覽 */}
      <div className="flex bg-white p-2 rounded-3xl border border-slate-100 shadow-md overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'roster' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <Users size={18} /> <span>名冊</span>
        </button>
        <button
          onClick={() => setActiveTab('approval')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'approval' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 relative'}`}
        >
          <UserPlus size={18} /> <span>審核</span>
          {pendingStudents.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-white">
              {pendingStudents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'points' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <GraduationCap size={18} /> <span>評分</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <Package size={18} /> <span>商品</span>
        </button>
        <button
          onClick={() => setActiveTab('mission_approval')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'mission_approval' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 relative'}`}
        >
          <CheckCircle size={18} /> <span>任務審核</span>
          {submissions.filter(s => s.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-white">
              {submissions.filter(s => s.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'scan' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <Camera size={18} /> <span>核銷</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <HistoryIcon size={18} /> <span>紀錄</span>
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'missions' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        >
          <Target size={18} /> <span>任務</span>
        </button>
        <button
          onClick={() => setActiveTab('wishes')}
          className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap ${activeTab === 'wishes' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 relative'}`}
        >
          <Heart size={18} /> <span>許願</span>
          {wishes.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-white text-[10px] flex items-center justify-center border-2 border-white">
              {wishes.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          {students.map(student => {
            const rank = getRank(student.totalEarned);
            return (
              <div key={student.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                <div className={`absolute top-0 right-0 w-24 h-24 ${rank.color} opacity-5 -translate-y-12 translate-x-12 rounded-full`}></div>
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${rank.color}`}></div>
                    <img src={student.avatar} className={`w-24 h-24 rounded-full border-4 border-white shadow-2xl relative z-10 object-cover`} alt={student.name} />
                    <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center text-xl z-20 border border-slate-50`}>
                      {rank.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 mb-1">{student.name}</h3>
                  <div className={`px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest mb-6 ${rank.color} shadow-sm`}>
                    {rank.name}
                  </div>

                  <div className="w-full grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">可用點數</p>
                      <p className="text-xl font-black text-indigo-600">{student.points.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-50">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">總累積</p>
                      <p className="text-xl font-black text-amber-600">{student.totalEarned.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">ID: {student.id.replace('user_', '')}</span>
                  <button
                    onClick={() => {
                      setTargetStudentId(student.id);
                      setActiveTab('points');
                    }}
                    className="text-indigo-600 font-black text-xs hover:underline flex items-center gap-1"
                  >
                    <Gift size={14} /> 發放點數
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'points' && (
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner">
              <Gift size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">學員點數發放系統</h2>
              <p className="text-slate-400 font-medium">針對特定學員的優異表現，手動核發獎勵點數。</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">第一步：選擇受獎學員</label>
                <div className="grid grid-cols-3 gap-4">
                  {students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setTargetStudentId(s.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${targetStudentId === s.id ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-50 bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}
                    >
                      <img src={s.avatar} className="w-12 h-12 rounded-full shadow-sm" alt={s.name} />
                      <span className={`font-black text-sm ${targetStudentId === s.id ? 'text-indigo-600' : 'text-slate-600'}`}>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">第二步：發放名目</label>
                  <button
                    onClick={() => setIsAddingReason(!isAddingReason)}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    {isAddingReason ? <X size={14} /> : <Plus size={14} />}
                    {isAddingReason ? '取消新增' : '管理名目'}
                  </button>
                </div>

                {isAddingReason ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border-2 border-indigo-100 mb-4 animate-in zoom-in-95 duration-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="輸入新名目 (例: 認真打掃)"
                        value={newReason}
                        onChange={e => setNewReason(e.target.value)}
                        className="flex-1 p-3 border-2 border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold"
                      />
                      <button
                        onClick={handleAddReason}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-md"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                      {pointReasons.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100">
                          <span className="font-bold text-sm text-slate-700">{r.title}</span>
                          <button onClick={() => handleDeleteReason(r.id)} className="text-rose-500 hover:text-rose-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-bold text-slate-700 shadow-inner"
                  >
                    <option value="">請選擇發放名目...</option>
                    {pointReasons.length > 0 ? (
                      pointReasons.map(r => (
                        <option key={r.id} value={r.title}>{r.title}</option>
                      ))
                    ) : (
                      <>
                        <option>期中考試成績優異</option>
                        <option>課堂專題報告表現亮眼</option>
                        <option>作業提前完成並獲得 A++</option>
                        <option>熱心助人、品格優秀</option>
                      </>
                    )}
                    <option value="other">其他自定義原因</option>
                  </select>
                )}
                {reason === 'other' && !isAddingReason && (
                  <input
                    type="text"
                    placeholder="請輸入發放原因..."
                    value={reason === 'other' ? '' : reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full mt-4 p-5 bg-white border-2 border-indigo-200 rounded-2xl outline-none font-bold text-slate-700"
                  />
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">第三步：調整點數金額</label>
                <div className="relative">
                  <input
                    type="number"
                    value={pointAmount}
                    onChange={e => setPointAmount(e.target.value)}
                    className="w-full p-8 text-5xl font-black bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-indigo-600 shadow-inner"
                  />
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="font-black text-slate-300 text-2xl uppercase tracking-tighter">PTS</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleIssuePoints}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-8 rounded-[2rem] transition-all shadow-2xl shadow-emerald-200 flex items-center justify-center gap-4 text-2xl active:scale-95 group"
              >
                <Check size={32} className="group-hover:scale-125 transition-transform" />
                確認核發獎勵
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl animate-in slide-in-from-bottom-4">
          <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <UserPlus className="text-indigo-600" />
            註冊審核
            <span className="bg-indigo-100 text-indigo-600 text-sm px-3 py-1 rounded-full">{pendingStudents.length} 待處裡</span>
          </h2>

          <div className="space-y-4">
            {pendingStudents.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-bold">目前沒有待審核的註冊申請</div>
            ) : (
              pendingStudents.map(student => (
                <div key={student.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                      {student.name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-800">{student.name}</h3>
                      <p className="text-slate-500 text-sm font-bold">{student.grade || '未填寫年級'}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(student.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-emerald-100"
                    >
                      核准
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 px-6 py-2 rounded-xl font-bold transition-all"
                    >
                      拒絕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <Package className="text-indigo-600" /> 商品管理系統
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsManagingCats(!isManagingCats)}
                className="bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
              >
                <Target size={18} /> 分類管理
              </button>
              <button
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={20} /> 上架新品
              </button>
            </div>
          </div>

          {isManagingCats && (
            <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200 animate-in fade-in">
              <h3 className="font-black text-slate-700 mb-4">商品分類管理</h3>
              <div className="flex gap-4 mb-6">
                <input
                  placeholder="輸入新分類名稱 (例如: 夏季限定)"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="flex-1 p-3 rounded-xl border border-slate-200 font-bold outline-none"
                />
                <button
                  onClick={() => {
                    if (newCatName) {
                      addProductCategory(newCatName);
                      setNewCatName('');
                    }
                  }}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700"
                >
                  新增分類
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm font-bold text-slate-600">
                    {cat.name}
                    <button onClick={() => deleteProductCategory(cat.id)} className="text-slate-300 hover:text-rose-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAddingProduct && (
            <form onSubmit={handleAddProduct} className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200 animate-in fade-in">
              <h3 className="font-black text-slate-700 mb-4">輸入新商品資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  placeholder="商品名稱"
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newProductCategory}
                  onChange={e => setNewProductCategory(e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  {categories.length === 0 && <option value="">請先新增分類</option>}
                </select>
                <input
                  placeholder="圖片連結 (可選)"
                  value={newProductImage}
                  onChange={e => setNewProductImage(e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  placeholder="價格 (點數)"
                  type="number"
                  value={newProductPrice}
                  onChange={e => setNewProductPrice(e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  placeholder="庫存數量"
                  type="number"
                  value={newProductStock}
                  onChange={e => setNewProductStock(e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddingProduct(false)} className="px-4 py-2 text-slate-400 font-bold hover:text-slate-600">取消</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">確認上架</button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="border border-slate-100 rounded-[2rem] p-6 flex flex-col gap-4 group hover:shadow-xl transition-all bg-white relative">
                <div className="flex gap-4 items-center">
                  <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-lg">{product.name}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{product.category}</p>
                    <p className="text-indigo-600 font-black">{product.price} PTS</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">庫存管理</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={product.stock}
                        onBlur={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                        className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${product.stock > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {product.stock > 0 ? 'ON SALE' : 'SOLD OUT'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mission_approval' && (
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl animate-in slide-in-from-bottom-4">
          <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <CheckCircle className="text-emerald-600" />
            任務提交審核
            <span className="bg-emerald-100 text-emerald-600 text-sm px-3 py-1 rounded-full">{submissions.filter(s => s.status === 'pending').length} 待處裡</span>
          </h2>

          <div className="space-y-6">
            {submissions.filter(s => s.status === 'pending').length === 0 ? (
              <div className="text-center py-24 text-slate-400 font-bold bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
                目前沒有待審核的任務提交
              </div>
            ) : (
              submissions.filter(s => s.status === 'pending').map(sub => (
                <div key={sub.id} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl font-black text-indigo-600 border border-slate-100">
                      {sub.userName[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800">{sub.userName}</h3>
                      <p className="text-slate-500 font-bold flex items-center gap-2">
                        提交了任務：<span className="text-indigo-600">「{sub.missionTitle}」</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">
                        獎勵點數：{sub.points} PTS • 提交時間：{new Date(sub.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleApproveMission(sub.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-emerald-100 flex items-center gap-2"
                    >
                      <Check size={20} /> 核准發放
                    </button>
                    <button
                      onClick={() => handleRejectMission(sub.id)}
                      className="bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-8 py-3 rounded-2xl font-black transition-all border border-slate-200"
                    >
                      不予核准
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'scan' && (
        <div className="bg-white rounded-[3rem] p-16 border border-slate-100 text-center shadow-xl animate-in fade-in">
          <div className="bg-indigo-50 w-32 h-32 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner">
            <Camera size={56} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">QR Code 核銷中心</h2>
          <p className="text-slate-400 mb-8 font-medium max-w-md mx-auto leading-relaxed">攝像頭已就緒。請將學員的 QR Code 對準下方區域，系統將自動辨識並進行核銷。</p>

          <div className="max-w-md mx-auto mb-8 overflow-hidden rounded-[2rem] border-4 border-indigo-50 shadow-inner">
            <div id="reader" className="w-full"></div>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">或手動輸入對應字串</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            <input
              type="text"
              placeholder="貼上 QR Code 代碼..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-indigo-50 rounded-2xl focus:bg-white focus:border-indigo-600 outline-none font-mono text-xs text-slate-500 text-center"
            />
          </div>

          <button
            onClick={() => handleStartScan()}
            disabled={isScanning}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-16 py-6 rounded-[2rem] font-black transition-all shadow-2xl shadow-indigo-200 inline-flex items-center justify-center gap-4 text-xl active:scale-95"
          >
            {isScanning ? '正在比對資料庫...' : '確認代碼並核銷'}
          </button>
        </div>
      )}

      {activeTab === 'history' && (
        <section className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in">
          <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="font-black text-2xl text-slate-800 flex items-center gap-3">
              <HistoryIcon className="text-indigo-600" />
              全體兌換日誌
            </h2>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-5 pr-5 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm font-bold shadow-inner"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="搜尋學生、商品或流水號..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-14 pr-8 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none text-sm w-full md:w-80 shadow-inner font-bold"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">狀態</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">學員</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">兌換商品</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">扣點</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">日期</th>
                  <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRedemptions.map(r => {
                  try {
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6 whitespace-nowrap">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                            {r.status === 'completed' ? '已核銷' : r.status === 'pending' ? '待處理' : '已取消'}
                          </span>
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap font-black text-slate-800">
                          {students.find(s => s.id === r.userId)?.name || '未知學員'}
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap font-bold text-slate-600">{r.productName}</td>
                        <td className="px-10 py-6 whitespace-nowrap text-indigo-600 font-black">{r.pointsSpent} PTS</td>
                        <td className="px-10 py-6 whitespace-nowrap text-slate-400 text-sm font-bold">
                          {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '無日期'}
                        </td>
                        <td className="px-10 py-6 whitespace-nowrap">
                          {r.status === 'pending' ? (
                            <button
                              onClick={() => handleConfirmRedemption(r.id)}
                              className="text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-xl shadow-indigo-100 active:scale-95"
                            >
                              立即核銷
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-300 font-black text-[10px] tracking-widest">
                              <Check size={14} /> FINISHED
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  } catch (err) {
                    console.error("Row render error", err);
                    return null;
                  }
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'missions' && (
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <Target className="text-indigo-600" /> 任務管理系統
            </h2>
            <button
              onClick={() => setIsAddingMission(!isAddingMission)}
              className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={18} /> 新增任務
            </button>
          </div>

          {isAddingMission && (
            <form onSubmit={handleAddMission} className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200 animate-in fade-in">
              <h3 className="font-black text-slate-700 mb-4">建立新挑戰</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  placeholder="任務名稱"
                  value={newMissionTitle}
                  onChange={e => setNewMissionTitle(e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  placeholder="獎勵點數"
                  type="number"
                  value={newMissionPoints}
                  onChange={e => setNewMissionPoints(e.target.value)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={newMissionType}
                  onChange={e => setNewMissionType(e.target.value as any)}
                  className="p-3 rounded-xl border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="normal">一般任務</option>
                  <option value="challenge">挑戰任務</option>
                  <option value="hard">困難任務</option>
                </select>
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                  <Clock size={18} className="text-slate-400" />
                  <input
                    type="datetime-local"
                    value={newMissionDeadline}
                    onChange={e => setNewMissionDeadline(e.target.value)}
                    className="font-bold outline-none text-slate-600 w-full"
                    placeholder="截止日期 (可選)"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingMission(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-400 hover:bg-slate-200 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  確認建立
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-4">
            {missions.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                目前沒有任何任務，請點擊上方按鈕新增。
              </div>
            )}
            {missions.map(mission => (
              <div key={mission.id} className={`flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border transition-all ${mission.isActive ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${mission.type === 'normal' ? 'bg-emerald-100 text-emerald-600' :
                    mission.type === 'challenge' ? 'bg-orange-100 text-orange-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                    {mission.type === 'normal' ? 'N' : mission.type === 'challenge' ? 'C' : 'H'}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                      {mission.title}
                      {!mission.isActive && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">已停用</span>}
                    </h3>
                    <p className="text-slate-400 text-sm font-bold flex items-center gap-2">
                      <span className="text-indigo-500">{mission.points} PTS</span> • {mission.description}
                      {mission.deadline && (
                        <span className="flex items-center gap-1 text-amber-500 ml-2">
                          <Clock size={14} /> {new Date(mission.deadline).toLocaleString()} 截止
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleMission(mission.id)}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all whitespace-nowrap ${mission.isActive
                    ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                >
                  {mission.isActive ? '停用任務' : '啟用任務'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'wishes' && (
        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl animate-in slide-in-from-bottom-4">
          <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <Heart className="text-pink-500" /> 許願池管理
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wishes.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-400 font-bold">目前還沒有人許願喔！</div>
            ) : (
              wishes.map(wish => (
                <div key={wish.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 relative group">
                  <button
                    onClick={() => handleDeleteWish(wish.id)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full text-slate-300 hover:text-rose-500 hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="flex items-center gap-4 mb-4">
                    <img src={wish.userAvatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={wish.userName} />
                    <div>
                      <h4 className="font-black text-slate-800">{wish.userName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(wish.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">想要：{wish.itemName}</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed italic">"{wish.description}"</p>
                  <div className="flex items-center gap-2 text-pink-500 font-black text-sm">
                    <Heart size={16} fill="currentColor" /> {wish.likedBy?.length || 0} 人集氣中
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 z-[150] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8">
          <div className="relative w-full max-w-lg aspect-square border-8 border-white/5 rounded-[5rem] overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <ScanLine size={140} className="mx-auto mb-10 animate-pulse text-indigo-400" />
                <p className="text-3xl font-black text-white mb-4 tracking-tight">搜尋有效條碼中...</p>
                <p className="text-indigo-300 font-bold tracking-widest uppercase text-xs">AI Computer Vision Active</p>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-3 bg-indigo-400 shadow-[0_0_50px_rgba(129,140,248,1)] animate-scan-line"></div>
          </div>
          <button
            onClick={() => setIsScanning(false)}
            className="mt-16 bg-white/5 hover:bg-white/10 text-white px-12 py-5 rounded-[2rem] font-black transition-all border border-white/10 flex items-center gap-4 text-lg backdrop-blur"
          >
            <X size={24} /> 取消掃描
          </button>
          <style>{`
            @keyframes scan-line {
              0% { top: 0% }
              100% { top: 100% }
            }
            .animate-scan-line {
              animation: scan-line 3s linear infinite;
            }
          `}</style>
        </div>
      )}

      {scanResult && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-2xl">
          <div className="bg-white rounded-[4rem] max-w-md w-full p-12 shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 w-24 h-24 rounded-[2rem] flex items-center justify-center text-emerald-600 mb-10 mx-auto shadow-inner">
              <ShieldCheck size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 text-center mb-10 tracking-tight">驗證成功！</h2>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-6 mb-12 border border-slate-100 shadow-inner">
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">申請學員</span>
                <span className="font-black text-slate-800 text-xl">{students.find(s => s.id === scanResult.userId)?.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200/50">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">兌換項目</span>
                <span className="font-black text-slate-800 text-xl">{scanResult.productName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">核銷點數</span>
                <span className="font-black text-indigo-600 text-2xl">{scanResult.pointsSpent} <span className="text-xs font-bold text-indigo-400">PTS</span></span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleConfirmRedemption(scanResult.id)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl transition-all shadow-2xl shadow-indigo-100 flex items-center justify-center gap-4 text-xl active:scale-95"
              >
                <Check size={28} />
                確認發放獎勵
              </button>
              <button
                onClick={() => setScanResult(null)}
                className="w-full bg-slate-100 text-slate-600 font-bold py-5 rounded-2xl hover:bg-slate-200 transition-all text-lg"
              >
                稍後處理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
