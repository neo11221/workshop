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
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, Redemption, UserRole, Product, Wish, Mission, ChallengeHistory, PointReason, MissionSubmission, ProductCategory, Banner } from '../types';
import { STORAGE_KEYS, PRODUCTS } from '../constants';

// Collections
const COLLECTIONS = {
  STUDENTS: 'students',
  MISSIONS: 'missions',
  PRODUCTS: 'products',
  WISHES: 'wishes',
  REDEMPTIONS: 'redemptions',
  CHALLENGE_HISTORY: 'challengeHistory',
  POINT_REASONS: 'pointReasons',
  MISSION_SUBMISSIONS: 'missionSubmissions',
  PRODUCT_CATEGORIES: 'productCategories',
  BANNERS: 'banners',
};



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
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as UserProfile);
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const saveStudent = async (student: UserProfile) => {
  try {
    await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), student);
  } catch (error) {
    console.error('Error saving student:', error);
    console.error('儲存學生資料失敗，請檢查網路或權限');
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
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&mouth=smile&eyebrows=defaultNatural&eyes=default`,
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

import { auth } from './firebase';

export const logoutUser = async () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  await auth.signOut();
};

// --- Redemptions Management ---

export const getRedemptions = async (): Promise<Redemption[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.REDEMPTIONS));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: 'pending',
        pointsSpent: 0,
        productName: '未知商品',
        timestamp: Date.now(),
        userId: 'unknown',
        qrCodeData: '',
        ...data
      } as Redemption;
    });
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

// --- Product Categories ---

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCT_CATEGORIES));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ProductCategory);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const addProductCategory = async (name: string) => {
  try {
    const id = `cat_${Date.now()}`;
    await setDoc(doc(db, COLLECTIONS.PRODUCT_CATEGORIES, id), { id, name });
  } catch (error) {
    console.error('Error adding category:', error);
  }
};

export const deleteProductCategory = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCT_CATEGORIES, id));
  } catch (error) {
    console.error('Error deleting category:', error);
  }
};

export const subscribeToProductCategories = (callback: (categories: ProductCategory[]) => void) => {
  return onSnapshot(collection(db, COLLECTIONS.PRODUCT_CATEGORIES), (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ProductCategory);
    callback(categories);
  });
};


export const getMissions = async (): Promise<Mission[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.MISSIONS));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Mission);
  } catch (error) {
    console.error('Error fetching missions:', error);
    return [];
  }
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
    const docId = `h_${Date.now()}_${record.userId}`;
    await setDoc(doc(db, COLLECTIONS.CHALLENGE_HISTORY, docId), record);
  } catch (error) {
    console.error('Error adding challenge history:', error);
  }
};

/**
 * [OPTIMIZED] 檢查特定任務今日是否已完成
 * 僅抓取符合 userId, missionId 且時間為今日之後的紀錄，限制回傳 1 筆。
 */
export const hasCompletedMission = async (
  userId: string,
  missionId: string
): Promise<boolean> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, COLLECTIONS.CHALLENGE_HISTORY),
      where('userId', '==', userId),
      where('missionId', '==', missionId),
      where('timestamp', '>=', today.getTime()),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking mission completion:', error);
    return false;
  }
};

/**
 * [OPTIMIZED] 一次獲取該學生今日所有已完成的任務 ID
 * 避免在 Dashboard 循環呼叫 API。
 */
export const getTodayCompletedMissionIds = async (userId: string): Promise<Set<string>> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, COLLECTIONS.CHALLENGE_HISTORY),
      where('userId', '==', userId),
      where('timestamp', '>=', today.getTime())
    );

    const querySnapshot = await getDocs(q);
    const ids = new Set<string>();
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.missionId) ids.add(data.missionId);
    });
    return ids;
  } catch (error) {
    console.error('Error fetching today completed missions:', error);
    return new Set();
  }
};

// --- Mission Submissions Management ---

export const submitMission = async (submission: MissionSubmission) => {
  try {
    // 額外檢查今日是否已完成
    const isCompleted = await hasCompletedMission(submission.userId, submission.missionId);
    if (isCompleted) {
      console.warn('Mission already completed today');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.MISSION_SUBMISSIONS))
    );
    const existingPendingToday = querySnapshot.docs.find(d => {
      const data = d.data();
      return data.userId === submission.userId &&
        data.missionId === submission.missionId &&
        data.status === 'pending' &&
        data.timestamp >= today.getTime();
    });

    if (existingPendingToday) {
      console.warn('Mission submission already pending today');
      return;
    }

    await setDoc(doc(db, COLLECTIONS.MISSION_SUBMISSIONS, submission.id), submission);
  } catch (error) {
    console.error('Error submitting mission:', error);
  }
};

export const approveMission = async (submissionId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.MISSION_SUBMISSIONS, submissionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const submission = docSnap.data() as MissionSubmission;

      // 1. Update submission status
      await updateDoc(docRef, { status: 'approved' });

      // 2. Add to challenge history
      await addChallengeHistory({
        id: `h_${Date.now()}`,
        userId: submission.userId,
        missionId: submission.missionId,
        timestamp: Date.now()
      });

      // 3. Award points to student
      const studentDoc = doc(db, COLLECTIONS.STUDENTS, submission.userId);
      const studentSnap = await getDoc(studentDoc);
      if (studentSnap.exists()) {
        const student = studentSnap.data() as UserProfile;
        await updateDoc(studentDoc, {
          points: student.points + submission.points,
          totalEarned: student.totalEarned + submission.points
        });
      }
    }
  } catch (error) {
    console.error('Error approving mission:', error);
  }
};

export const rejectMission = async (submissionId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.MISSION_SUBMISSIONS, submissionId);
    await updateDoc(docRef, { status: 'rejected' });
  } catch (error) {
    console.error('Error rejecting mission:', error);
  }
};

export const subscribeToMissionSubmissions = (callback: (submissions: MissionSubmission[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.MISSION_SUBMISSIONS), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as MissionSubmission));
  });
};

// --- Products Management ---

export const getProducts = async (): Promise<Product[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Product);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
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
    await updateDoc(docRef, { stock: Math.max(0, quantity) });
  } catch (error) {
    console.error('Error updating product stock:', error);
  }
};

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};

// --- Point Reasons Management ---

export const getPointReasons = async (): Promise<PointReason[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.POINT_REASONS));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as PointReason);
  } catch (error) {
    console.error('Error fetching point reasons:', error);
    return [];
  }
};

export const addPointReason = async (reason: PointReason) => {
  try {
    await setDoc(doc(db, COLLECTIONS.POINT_REASONS, reason.id), reason);
  } catch (error) {
    console.error('Error adding point reason:', error);
  }
};

export const deletePointReason = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.POINT_REASONS, id));
  } catch (error) {
    console.error('Error deleting point reason:', error);
  }
};

export const subscribeToPointReasons = (callback: (reasons: PointReason[]) => void): Unsubscribe => {
  return onSnapshot(collection(db, COLLECTIONS.POINT_REASONS), (snapshot) => {
    const reasons = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as PointReason);
    callback(reasons);
  });
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

export const updateWish = async (wishId: string, updates: Partial<Wish>) => {
  try {
    const docRef = doc(db, COLLECTIONS.WISHES, wishId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating wish:', error);
  }
};

export const deleteWish = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.WISHES, id));
  } catch (error) {
    console.error('Error deleting wish:', error);
  }
};

export const likeWish = async (wishId: string, userId: string) => {
  try {
    const docRef = doc(db, COLLECTIONS.WISHES, wishId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const wish = docSnap.data() as Wish;
      const likedBy = wish.likedBy || [];

      // If already liked, remove like (toggle) - or strictly one time? 
      // User said "each wish can only be liked once per person"
      if (likedBy.includes(userId)) {
        // Option A: alert and return
        console.error('你已經為這個願望集過氣囉！');
        return;
      }

      await updateDoc(docRef, {
        likedBy: [...likedBy, userId]
      });
    }
  } catch (error) {
    console.error('Error liking wish:', error);
  }
};

// --- Real-time listeners ---

export const subscribeToStudents = (callback: (students: UserProfile[]) => void): Unsubscribe => {
  return onSnapshot(
    collection(db, COLLECTIONS.STUDENTS),
    (snapshot) => {
      const students = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as UserProfile);
      callback(students);
    },
    (error) => {
      console.error('Error in subscribeToStudents:', error);
      // alert('無法讀取學生資料！請檢查 Firestore 權限規則');
    }
  );
};

export const subscribeToMissions = (callback: (missions: Mission[]) => void): Unsubscribe => {
  return onSnapshot(
    collection(db, COLLECTIONS.MISSIONS),
    (snapshot) => {
      const missions = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Mission);
      callback(missions);
    },
    (error) => console.error('Error subscribing to missions:', error)
  );
};

export const subscribeToProducts = (callback: (products: Product[]) => void): Unsubscribe => {
  return onSnapshot(
    collection(db, COLLECTIONS.PRODUCTS),
    (snapshot) => {
      const products = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Product);
      callback(products);
    },
    (error) => {
      console.error('Error subscribing to products:', error);
      console.error('無法讀取商品列表（權限不足或連線失敗）');
    }
  );
};

export const subscribeToWishes = (callback: (wishes: Wish[]) => void): Unsubscribe => {
  return onSnapshot(
    collection(db, COLLECTIONS.WISHES),
    (snapshot) => {
      const wishes = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Wish);
      callback(wishes);
    },
    (error) => console.error('Error subscribing to wishes:', error)
  );
};

export const subscribeToRedemptions = (
  callback: (redemptions: Redemption[]) => void
): Unsubscribe => {
  return onSnapshot(
    collection(db, COLLECTIONS.REDEMPTIONS),
    (snapshot) => {
      const redemptions = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Defensive coding for potentially missing fields
        return {
          id: doc.id,
          status: 'pending',
          pointsSpent: 0,
          productName: '未知商品',
          timestamp: Date.now(),
          userId: 'unknown',
          qrCodeData: '',
          ...data
        } as Redemption;
      });
      callback(redemptions);
    },
    (error) => {
      console.error('Error subscribing to redemptions:', error);
    }
  );
};

// --- Banners ---

export const addBanner = async (
  imageUrl: string,
  tag: string = '精選推薦',
  objectPosition: string = 'center',
  mobileHeight: string = 'h-48',
  desktopHeight: string = 'md:h-72'
) => {
  try {
    const newBanner: Banner = {
      id: `banner_${Date.now()}`,
      imageUrl,
      tag,
      active: true,
      timestamp: Date.now(),
      objectPosition,
      mobileHeight,
      desktopHeight,
    };
    await setDoc(doc(db, COLLECTIONS.BANNERS, newBanner.id), newBanner);
  } catch (error) {
    console.error('Error adding banner:', error);
    throw error;
  }
};

export const deleteBanner = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.BANNERS, id));
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw error;
  }
};

export const subscribeToBanners = (callback: (banners: Banner[]) => void): Unsubscribe => {
  const q = query(collection(db, COLLECTIONS.BANNERS));
  return onSnapshot(q, (snapshot) => {
    const banners = snapshot.docs.map(doc => doc.data() as Banner);
    // Sort by timestamp desc
    banners.sort((a, b) => b.timestamp - a.timestamp);
    callback(banners);
  }, (error) => {
    console.error('Error subscribing to banners:', error);
  });
};
