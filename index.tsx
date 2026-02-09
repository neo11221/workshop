
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const AppWithConfigCheck: React.FC = () => {
  const isConfigured = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID;

  return (
    <>
      <App />
      {!isConfigured && (
        <div style={{
          position: 'fixed', bottom: 10, left: 10, right: 10,
          background: 'rgba(239, 68, 68, 0.9)', color: 'white',
          padding: '10px', borderRadius: '8px', zIndex: 9999,
          fontSize: '12px', textAlign: 'center'
        }}>
          ⚠️ Firebase 配置未完成 (GitHub Secrets)。功能可能無法運作。
        </div>
      )}
    </>
  );
};

root.render(
  <React.StrictMode>
    <AppWithConfigCheck />
  </React.StrictMode>
);
