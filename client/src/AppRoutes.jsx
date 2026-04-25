import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import EtherealField from './components/EtherealField';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

const GlobalLoader = () => (
  <div style={{ height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', position: 'fixed', zIndex: 999 }}>
    <EtherealField />
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid transparent', borderTopColor: 'var(--accent-primary)', borderBottomColor: 'var(--accent-secondary)', position: 'absolute' }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))', filter: 'blur(10px)', opacity: 0.6 }}
      />
      <h2 style={{ position: 'absolute', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold', color: 'white' }}>ETHEREAL</h2>
    </div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      style={{ marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-dim)', letterSpacing: '1px' }}
    >
      Initializing Systems...
    </motion.p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/auth" />;
  
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Centralized Theme Application
  useEffect(() => {
    const applyTheme = (themeMode) => {
      if (themeMode === 'light') {
        document.body.classList.add('light-mode');
      } else {
        document.body.classList.remove('light-mode');
      }
    };

    if (user) {
      const targetTheme = user.theme || 'dark';
      applyTheme(targetTheme);
      localStorage.setItem('theme', targetTheme);
    } else {
      const localTheme = localStorage.getItem('theme') || 'dark';
      applyTheme(localTheme);
    }
  }, [user, user?.theme, loading]);

  if (loading) return <GlobalLoader />;

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
