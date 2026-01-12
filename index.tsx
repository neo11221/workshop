
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// 檢查必要的環境變數
const isConfigured = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID;

if (!isConfigured) {
  root.render(
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>⚠️ 網站配置未完成</h1>
      <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '24px' }}>
        檢測到 Firebase 環境變數缺失，這通常是因為 GitHub Secrets 尚未設定。
      </p>
      <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '12px', textAlign: 'left', fontSize: '14px' }}>
        <strong>請前往 GitHub Repository Settings 設定以下 Secrets：</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#4b5563' }}>
          <li>VITE_FIREBASE_API_KEY</li>
          <li>VITE_FIREBASE_AUTH_DOMAIN</li>
          <li>VITE_FIREBASE_PROJECT_ID</li>
          <li>... (以及其他 3 個)</li>
        </ul>
      </div>
      <p style={{ marginTop: '24px', fontSize: '12px', color: '#9ca3af' }}>
        如果您是在本地開發，請確認 .env.local 檔案是否存在。
      </p>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
