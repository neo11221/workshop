import { UserProfile, Redemption, UserRole, Product, Wish, Mission, ChallengeHistory } from '../types';
import { STORAGE_KEYS, PRODUCTS } from '../constants';

const INITIAL_STUDENTS: UserProfile[] = [
  {
    id: 'user_zhou',
    name: '周同學',
    points: 1200,
    totalEarned: 2500,
    role: UserRole.STUDENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhou',
    password: '123',
    grade: '七年級',
    isApproved: true
  },
  {
    id: 'user_hu',
    name: '胡同學',
    points: 800,
    totalEarned: 1800,
    role: UserRole.STUDENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hu',
    password: '123',
    grade: '八年級',
    isApproved: true
  },
  {
    id: 'user_lin',
    name: '林同學',
    points: 2100,
    totalEarned: 4200,
    role: UserRole.STUDENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lin',
    password: '123',
    grade: '九年級',
    isApproved: true
  }
];

// 管理員帳號
export const ADMIN_USER: UserProfile = {
  id: 'user_admin',
  name: '導師管理員',
  points: 0,
  totalEarned: 0,
  role: UserRole.ADMIN,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  isApproved: true
};

export const GUEST_USER: UserProfile = {
  id: 'user_guest',
  name: '訪客',
  points: 0,
  totalEarned: 0,
  role: UserRole.GUEST,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  isApproved: true
};

export const getStudents = (): UserProfile[] => {
  const stored = localStorage.getItem('workshop_students');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('workshop_students', JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
};

export const saveStudents = (students: UserProfile[]) => {
  localStorage.setItem('workshop_students', JSON.stringify(students));
};

export const registerStudent = (name: string, password: string, grade: string): boolean => {
  const students = getStudents();
  if (students.some(s => s.name === name)) return false;

  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    name,
    password,
    grade,
    points: 0,
    totalEarned: 0,
    role: UserRole.STUDENT,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
    isApproved: false
  };

  saveStudents([...students, newUser]);
  return true;
};

export const approveStudent = (id: string) => {
  const students = getStudents();
  const updated = students.map(s => s.id === id ? { ...s, isApproved: true } : s);
  saveStudents(updated);
};

export const deleteStudent = (id: string) => {
  const students = getStudents();
  saveStudents(students.filter(s => s.id !== id));
};

export const getUser = (): UserProfile | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

export const saveUser = (user: UserProfile) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  // 同步回學生列表
  if (user.role === UserRole.STUDENT) {
    const students = getStudents();
    const updated = students.map(s => s.id === user.id ? user : s);
    saveStudents(updated);
  }
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const getRedemptions = (): Redemption[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.REDEMPTIONS);
  return stored ? JSON.parse(stored) : [];
};

export const addRedemption = (redemption: Redemption) => {
  const current = getRedemptions();
  const updated = [redemption, ...current];
  localStorage.setItem(STORAGE_KEYS.REDEMPTIONS, JSON.stringify(updated));
};

export const updateRedemptionStatus = (id: string, status: 'completed' | 'cancelled') => {
  const current = getRedemptions();
  const updated = current.map(r => r.id === id ? { ...r, status } : r);
  localStorage.setItem(STORAGE_KEYS.REDEMPTIONS, JSON.stringify(updated));
};

// --- Products Management ---

// --- Mission Management ---
const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: '完成今日回家作業',
    description: '確實完成各科今日指派之回家作業，並經家長簽名。',
    points: 100,
    type: 'normal',
    isActive: true,
    maxAttempts: 1
  },
  {
    id: 'm2',
    title: '數學周考 80 分以上',
    description: '在每周數學小考中獲得優異成績，展現邏輯推理能力。',
    points: 300, // 200 * 1.5 rounded
    type: 'challenge',
    isActive: true,
    maxAttempts: 1
  },
  {
    id: 'm3',
    title: '國文段考 90 分以上',
    description: '在學校大考中獲得卓越成績，深厚的文學涵養與理解。',
    points: 1000, // 500 * 2.0
    type: 'hard',
    isActive: true,
    maxAttempts: 1
  }
];

export const getMissions = (): Mission[] => {
  const stored = localStorage.getItem('workshop_missions');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('workshop_missions', JSON.stringify(INITIAL_MISSIONS));
  return INITIAL_MISSIONS;
};

export const saveMissions = (missions: Mission[]) => {
  localStorage.setItem('workshop_missions', JSON.stringify(missions));
};

export const addMission = (mission: Mission) => {
  const missions = getMissions();
  saveMissions([...missions, mission]);
};

export const toggleMission = (id: string) => {
  const missions = getMissions();
  const updated = missions.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m);
  saveMissions(updated);
};

export const getChallengeHistory = (): ChallengeHistory[] => {
  const stored = localStorage.getItem('workshop_challenge_history');
  return stored ? JSON.parse(stored) : [];
};

export const addChallengeHistory = (record: ChallengeHistory) => {
  const history = getChallengeHistory();
  localStorage.setItem('workshop_challenge_history', JSON.stringify([...history, record]));
};

export const hasCompletedMission = (userId: string, missionId: string): boolean => {
  const history = getChallengeHistory();
  // Simply check if a record exists for this user and mission
  // If we wanted daily limits, we'd check timestamps here. 
  // Requirement: "每個任務限按一次" (Each task click once).
  return history.some(h => h.userId === userId && h.missionId === missionId);
};


export const getProducts = (): Product[] => {
  const stored = localStorage.getItem('workshop_products');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('workshop_products', JSON.stringify(PRODUCTS));
  return PRODUCTS;
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem('workshop_products', JSON.stringify(products));
};

export const addProduct = (product: Product) => {
  const products = getProducts();
  saveProducts([...products, product]);
};

export const updateProduct = (product: Product) => {
  const products = getProducts();
  const updated = products.map(p => p.id === product.id ? product : p);
  saveProducts(updated);
};

export const updateProductStock = (productId: string, quantity: number) => {
  const products = getProducts();
  const updated = products.map(p => {
    if (p.id === productId) {
      return { ...p, stock: Math.max(0, p.stock - quantity) };
    }
    return p;
  });
  saveProducts(updated);
};

// --- Wishes Management ---

export const getWishes = (): Wish[] => {
  const stored = localStorage.getItem('workshop_wishes');
  return stored ? JSON.parse(stored) : [];
};

export const addWish = (wish: Wish) => {
  const wishes = getWishes();
  const updated = [wish, ...wishes];
  localStorage.setItem('workshop_wishes', JSON.stringify(updated));
};

export const likeWish = (wishId: string) => {
  const wishes = getWishes();
  const updated = wishes.map(w =>
    w.id === wishId ? { ...w, likes: w.likes + 1 } : w
  );
  localStorage.setItem('workshop_wishes', JSON.stringify(updated));
};
