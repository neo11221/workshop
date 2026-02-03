export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  GUEST = 'GUEST'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  points: number;
  totalEarned: number;
  role: UserRole;
  avatar: string;
  password?: string;
  grade?: string;
  isApproved?: boolean;
}

// Alias for backward compatibility
export type UserProfile = User;

export interface Redemption {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  pointsSpent: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'cancelled';
  qrCodeData: string;
}

export interface RankTitle {
  name: string;
  threshold: number;
  color: string;
  icon: string;
}

export interface LearningMission {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'quiz' | 'reading' | 'practice';
}

// ... existing types
export interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'normal' | 'challenge' | 'hard';
  isActive: boolean;
  maxAttempts: number; // Usually 1 for "once per user"
  deadline?: number; // Unix timestamp for time-limited missions
}

export interface ChallengeHistory {
  id: string;
  userId: string;
  missionId: string;
  timestamp: number;
}

export interface Wish {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  itemName: string;
  description: string;
  timestamp: number;
  likedBy: string[]; // Store IDs of users who liked this wish
}

export interface PointReason {
  id: string;
  title: string;
}

export interface MissionSubmission {
  id: string;
  userId: string;
  userName: string;
  missionId: string;
  missionTitle: string;
  points: number;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Banner {
  id: string;
  imageUrl: string;
  tag: string; // "新品上架", "特價出清", "精選推薦" 等
  link?: string;
  active: boolean;
  timestamp: number;
  objectPosition?: string; // CSS object-position (e.g., 'center', 'top', '50% 20%')
  mobileHeight?: string; // mobile height class (e.g., 'h-40')
  desktopHeight?: string; // desktop height class (e.g., 'md:h-80')
}
