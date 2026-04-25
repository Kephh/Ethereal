import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ChatPage from './pages/ChatPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20vh' }}>Loading Ethereal...</div>;
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

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
