import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertCircle, Check, X, Tag, Package } from 'lucide-react';
import { Product, UserProfile, Redemption, ProductCategory } from '../types';
import { saveUser, addRedemption, updateProductStock, subscribeToProducts, subscribeToProductCategories } from '../utils/storage';

interface ShopProps {
  user: UserProfile;
  onUserUpdate: () => void;
}

const Shop: React.FC<ShopProps> = ({ user, onUserUpdate }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  useEffect(() => {
    // Subscribe to real-time products updates
    const unsubProducts = subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });

    const unsubCategories = subscribeToProductCategories((updatedCats) => {
      setCategories(updatedCats);
    });

    return () => {
      unsubProducts();
      unsubCategories();
    };
  }, []);

  const filteredProducts = products.filter(p => filter === 'all' || p.category === filter);

  const handleRedeem = async () => {
    if (user.role === 'GUEST') {
      alert('訪客模式無法兌換商品，請登入學生帳號。');
      return;
    }
    if (!selectedProduct || user.points < selectedProduct.price || selectedProduct.stock <= 0) return;

    const newRedemption: Redemption = {
      id: `red_${Date.now()}`,
      userId: user.id,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      pointsSpent: selectedProduct.price,
      timestamp: Date.now(),
      status: 'pending',
      qrCodeData: `AUTH_WORKSHOP_${Date.now()}_${selectedProduct.id}`
    };

    const updatedUser = {
      ...user,
      points: user.points - selectedProduct.price
    };

    // Update storage (async)
    await addRedemption(newRedemption);
    await saveUser(updatedUser);
    await updateProductStock(selectedProduct.id, 1);

    // Refresh
    onUserUpdate();
    setSelectedProduct(null);
    alert('🎉 兌換成功！請前往兌換紀錄查看 QR Code。');
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">點數商城</h1>
        <p className="text-slate-500 mt-1">累積學習能量，換取心儀好物</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${filter === 'all'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            }`}
        >
          全部商品
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.name)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${filter === cat.name
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => {
          const canAfford = user.points >= product.price;
          const isOutOfStock = product.stock <= 0;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all flex flex-col group ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-5 left-5">
                  <span className="bg-white/90 backdrop-blur text-indigo-600 text-[10px] px-3 py-1.5 rounded-full font-black tracking-widest shadow-sm">
                    {product.category.toUpperCase()}
                  </span>
                </div>
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-black text-2xl rotate-12 border-4 border-white px-4 py-1">SOLD OUT</span>
                  </div>
                )}
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-xl text-slate-800 leading-tight">{product.name}</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6 flex-1 leading-relaxed">{product.description}</p>

                {/* 庫存顯示 */}
                <div className="flex items-center gap-2 mb-6 text-slate-400 text-xs font-bold">
                  <Package size={14} />
                  <span>剩餘庫存：<span className={product.stock <= 5 ? 'text-red-500' : 'text-slate-600'}>{product.stock} 件</span></span>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-indigo-600">
                    <span className="text-2xl font-black">{product.price.toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">pts</span>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    disabled={!canAfford || isOutOfStock}
                    className={`px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md ${isOutOfStock
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : canAfford
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                  >
                    {isOutOfStock ? '已售罄' : '立即兌換'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-8">
              <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
                <ShoppingCart size={28} />
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full">
                <X size={24} />
              </button>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-2">確認兌換項目</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              您確定要花費 <span className="font-black text-indigo-600">{selectedProduct.price} 點</span> 兌換 <span className="font-black text-slate-800">「{selectedProduct.name}」</span> 嗎？
            </p>

            <div className="bg-slate-50 rounded-[1.5rem] p-6 mb-8 border border-slate-100">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-500 font-medium">目前擁有點數</span>
                <span className="font-bold text-slate-800">{user.points.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-5">
                <span className="text-slate-500 font-medium">預計扣除點數</span>
                <span className="font-bold text-red-500">-{selectedProduct.price.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-5 flex justify-between">
                <span className="font-black text-slate-700 text-lg">剩餘可用</span>
                <span className="font-black text-indigo-600 text-2xl">{(user.points - selectedProduct.price).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRedeem}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.25rem] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 text-lg"
              >
                <Check size={24} />
                確認兌換
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full bg-white border border-slate-200 text-slate-600 font-black py-4 rounded-[1.25rem] hover:bg-slate-50 transition-all"
              >
                返回商城
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
