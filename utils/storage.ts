import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  onSnapshot,
  updateDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Redemption, UserRole, Product, Wish, Mission, ChallengeHistory } from '../types';
import { STORAGE_KEYS, PRODUCTS } from '../constants';

// Collections
const COLLECTIONS = {
  STUDENTS: 'students',
  MISSIONS: 'missions',
  PRODUCTS: 'products',
  WISHES: 'wishes',
  REDEMPTIONS: 'redemptions',
  CHALLENGE_HISTORY: 'challengeHistory',
};

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
    isApproved: true,
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
    isApproved: true,
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
    isApproved: true,
  },
];

// 管理員帳號
export const ADMIN_USER: UserProfile = {
  id: 'user_admin',
  name: '導師管理員',
  points: 0,
  totalEarned: 0,
  role: UserRole.ADMIN,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  isApproved: true,
};

export const GUEST_USER: UserProfile = {
  id: 'user_guest',
  name: '訪客',
  points: 0,
  totalEarned: 0,
  role: UserRole.GUEST,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  isApproved: true,
};

// --- Students Management ---

export const getStudents = async (): Promise<UserProfile[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    if (querySnapshot.empty) {
      // Initialize with default students
      await initializeStudents();
      return INITIAL_STUDENTS;
    }
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as UserProfile);
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const initializeStudents = async () => {
  const batch = writeBatch(db);
  INITIAL_STUDENTS.forEach((student) => {
    const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
    batch.set(docRef, student);
  });
  await batch.commit();
};

export const saveStudent = async (student: UserProfile) => {
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), student);
  } catch (error) {
    console.error('Error saving student:', error);
  }
};

export const saveStudents = async (students: UserProfile[]) => {
  const batch = writeBatch(db);
  students.forEach((student) => {
    const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
    batch.set(docRef, student);
  });
  await batch.commit();
};

export const registerStudent = async (
  name: string,
  password: string,
  grade: string
): Promise<boolean> => {
  try {
    const students = await getStudents();
    if (students.some((s) => s.name === name)) return false;

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      password,
      grade,
      points: 0,
      totalEarned: 0,
      role: UserRole.STUDENT,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      isApproved: false,
    };

    await saveStudent(newUser);
    return true;
  } catch (error) {
    console.error('Error registering student:', error);
    return false;
  }
};

export const approveStudent = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.STUDENTS, id);
    await updateDoc(docRef, { isApproved: true });
  } catch (error) {
    console.error('Error approving student:', error);
  }
};

export const deleteStudent = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STUDENTS, id));
  } catch (error) {
    console.error('Error deleting student:', error);
  }
};

// --- Current User Management (still using localStorage for session) ---

export const getUser = (): UserProfile | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

export const saveUser = async (user: UserProfile) => {
  // Save to localStorage for session
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  // Sync to Firestore if student
  if (user.role === UserRole.STUDENT) {
    await saveStudent(user);
  }
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// --- Redemptions Management ---

export const getRedemptions = async (): Promise<Redemption[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.REDEMPTIONS));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Redemption);
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return [];
  }
};

export const addRedemption = async (redemption: Redemption) => {
  try {
    await setDoc(doc(db, COLLECTIONS.REDEMPTIONS, redemption.id), redemption);
  } catch (error) {
    console.error('Error adding redemption:', error);
  }
};

export const updateRedemptionStatus = async (
  id: string,
  status: 'completed' | 'cancelled'
) => {
  try {
    const docRef = doc(db, COLLECTIONS.REDEMPTIONS, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error updating redemption status:', error);
  }
};

// --- Mission Management ---

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: '完成今日回家作業',
    description: '確實完成各科今日指派之回家作業，並經家長簽名。',
    points: 100,
    type: 'normal',
    isActive: true,
    maxAttempts: 1,
  },
  {
    id: 'm2',
    title: '數學周考 80 分以上',
    description: '在每周數學小考中獲得優異成績，展現邏輯推理能力。',
    points: 300,
    type: 'challenge',
    isActive: true,
    maxAttempts: 1,
  },
  {
    id: 'm3',
    title: '國文段考 90 分以上',
    description: '在學校大考中獲得卓越成績，深厚的文學涵養與理解。',
    points: 1000,
    type: 'hard',
    isActive: true,
    maxAttempts: 1,
  },
];

export const getMissions = async (): Promise<Mission[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.MISSIONS));
    if (querySnapshot.empty) {
      await initializeMissions();
      return INITIAL_MISSIONS;
    }
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Mission);
  } catch (error) {
    console.error('Error fetching missions:', error);
    return [];
  }
};

export const initializeMissions = async () => {
  const batch = writeBatch(db);
  INITIAL_MISSIONS.forEach((mission) => {
    const docRef = doc(db, COLLECTIONS.MISSIONS, mission.id);
    batch.set(docRef, mission);
  });
  await batch.commit();
};

export const saveMissions = async (missions: Mission[]) => {
  const batch = writeBatch(db);
  missions.forEach((mission) => {
    const docRef = doc(db, COLLECTIONS.MISSIONS, mission.id);
    batch.set(docRef, mission);
  });
  await batch.commit();
};

export const addMission = async (mission: Mission) => {
  try {
    await setDoc(doc(db, COLLECTIONS.MISSIONS, mission.id), mission);
  } catch (error) {
    console.error('Error adding mission:', error);
  }
};

export const toggleMission = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.MISSIONS, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const mission = docSnap.data() as Mission;
      await updateDoc(docRef, { isActive: !mission.isActive });
    }
  } catch (error) {
    console.error('Error toggling mission:', error);
  }
};

// --- Challenge History ---

export const getChallengeHistory = async (): Promise<ChallengeHistory[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.CHALLENGE_HISTORY));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as ChallengeHistory);
  } catch (error) {
    console.error('Error fetching challenge history:', error);
    return [];
  }
};

export const addChallengeHistory = async (record: ChallengeHistory) => {
  try {
    const docId = `${record.userId}_${record.missionId}_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.CHALLENGE_HISTORY, docId), record);
  } catch (error) {
    console.error('Error adding challenge history:', error);
  }
};

export const hasCompletedMission = async (
  userId: string,
  missionId: string
): Promise<boolean> => {
  try {
    const history = await getChallengeHistory();
    return history.some((h) => h.userId === userId && h.missionId === missionId);
  } catch (error) {
    console.error('Error checking mission completion:', error);
    return false;
  }
};

// --- Products Management ---

export const getProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (querySnapshot.empty) {
      await initializeProducts();
      return PRODUCTS;
    }
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Product);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const initializeProducts = async () => {
  const batch = writeBatch(db);
  PRODUCTS.forEach((product) => {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
    batch.set(docRef, product);
  });
  await batch.commit();
};

export const saveProducts = async (products: Product[]) => {
  const batch = writeBatch(db);
  products.forEach((product) => {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
    batch.set(docRef, product);
  });
  await batch.commit();
};

export const addProduct = async (product: Product) => {
  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
  } catch (error) {
    console.error('Error adding product:', error);
  }
};

export const updateProduct = async (product: Product) => {
  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
  } catch (error) {
    console.error('Error updating product:', error);
  }
};

export const updateProductStock = async (productId: string, quantity: number) => {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTS, productId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const product = docSnap.data() as Product;
      await updateDoc(docRef, { stock: Math.max(0, product.stock - quantity) });
    }
  } catch (error) {
    console.error('Error updating product stock:', error);
  }
};

// --- Wishes Management ---

export const getWishes = async (): Promise<Wish[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.WISHES));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Wish);
  } catch (error) {
    console.error('Error fetching wishes:', error);
    return [];
  }
};

export const addWish = async (wish: Wish) => {
  try {
    await setDoc(doc(db, COLLECTIONS.WISHES, wish.id), wish);
  } catch (error) {
    console.error('Error adding wish:', error);
  }
};

export const likeWish = async (wishId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.WISHES, wishId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const wish = docSnap.data() as Wish;
      await updateDoc(docRef, { likes: wish.likes + 1 });
    }
  } catch (error) {
    console.error('Error liking wish:', error);
  }
};

// --- Real-time listeners ---

export const subscribeToStudents = (callback: (students: UserProfile[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.STUDENTS), (snapshot) => {
    const students = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as UserProfile);
    callback(students);
  });
};

export const subscribeToMissions = (callback: (missions: Mission[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.MISSIONS), (snapshot) => {
    const missions = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Mission);
    callback(missions);
  });
};

export const subscribeToProducts = (callback: (products: Product[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.PRODUCTS), (snapshot) => {
    const products = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Product);
    callback(products);
  });
};

export const subscribeToWishes = (callback: (wishes: Wish[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.WISHES), (snapshot) => {
    const wishes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Wish);
    callback(wishes);
  });
};

export const subscribeToRedemptions = (
  callback: (redemptions: Redemption[]) => void
): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.REDEMPTIONS), (snapshot) => {
    const redemptions = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Redemption);
    callback(redemptions);
  });
};
