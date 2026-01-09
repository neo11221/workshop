export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  GUEST = 'GUEST'
}

export interface Product {
  id: string;
  name: string;
  category: 'food' | 'electronic' | 'ticket' | 'other';
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
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
  likes: number;
}
