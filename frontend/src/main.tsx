import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-right" toastOptions={{
          duration: 3000,
          style: { background: '#1f2937', color: '#f9fafb', borderRadius: '8px' },
        }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
