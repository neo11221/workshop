
import { Product, RankTitle } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: '精緻手工餅乾盒',
    category: 'food',
    price: 150,
    description: '酥脆可口的各種口味手工餅乾，下午茶首選。',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=400&h=300&auto=format&fit=crop',
    stock: 12
  },
  {
    id: 'p2',
    name: '珍珠奶茶兌換券',
    category: 'food',
    price: 80,
    description: '全台連鎖手搖飲中杯珍奶兌換券一張。',
    imageUrl: 'https://images.unsplash.com/photo-1544467316-e97029d2d47b?q=80&w=400&h=300&auto=format&fit=crop',
    stock: 45
  },
  {
    id: 'p3',
    name: '最新旗艦智慧手機',
    category: 'electronic',
    price: 12000,
    description: '年度最強旗艦機，擁有頂級攝影效能。',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&h=300&auto=format&fit=crop',
    stock: 1
  },
  {
    id: 'p4',
    name: '威秀影城電影票',
    category: 'ticket',
    price: 320,
    description: '全台威秀影城適用，享受震撼大銀幕。',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400&h=300&auto=format&fit=crop',
    stock: 8
  },
  {
    id: 'p5',
    name: '五星飯店下午茶券',
    category: 'food',
    price: 800,
    description: '知名五星級飯店雙人英式下午茶。',
    imageUrl: 'https://images.unsplash.com/photo-1544739313-6fad02872377?q=80&w=400&h=300&auto=format&fit=crop',
    stock: 3
  },
  {
    id: 'p6',
    name: '降噪藍牙耳機',
    category: 'electronic',
    price: 2500,
    description: '極致靜謐，享受純淨音質體驗。',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400&h=300&auto=format&fit=crop',
    stock: 5
  }
];

export const RANKS: RankTitle[] = [
  { name: '學徒初學者', threshold: 0, color: 'bg-slate-400', icon: '🌱' },
  { name: '積極求知者', threshold: 500, color: 'bg-blue-400', icon: '📖' },
  { name: '知識探索家', threshold: 2000, color: 'bg-green-500', icon: '🔍' },
  { name: '技能熟練工', threshold: 5000, color: 'bg-purple-500', icon: '🛠️' },
  { name: '領域領航員', threshold: 10000, color: 'bg-orange-500', icon: '🚀' },
  { name: '傳奇大宗師', threshold: 30000, color: 'bg-yellow-500', icon: '👑' }
];

export const STORAGE_KEYS = {
  USER: 'workshop_user',
  REDEMPTIONS: 'workshop_redemptions',
  NOTIFICATIONS: 'workshop_notifications'
};

export const GRADES = [
  '小五', '小六', '國一', '國二', '國三', '高一', '高二', '高三'
];
