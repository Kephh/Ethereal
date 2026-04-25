import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings as SettingsIcon, Shield, Bell, Zap, Moon, Sun, Monitor, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EtherealField from '../components/EtherealField';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isMobile] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState(user?.theme || localStorage.getItem('theme') || 'dark');
  const [notifications, setNotifications] = useState(JSON.parse(localStorage.getItem('notifications') || 'true'));

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Update theme in DB when changed
  const updateThemeInDB = async (newTheme) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/updateprofile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ theme: newTheme })
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.user);
      }
    } catch (err) { }
  };

  // Sync local theme state with user preference
  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    }
  }, [user?.theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    updateThemeInDB(newTheme);
  };

  const handlePasswordChange = async () => {
    setPassError('');
    setPassSuccess('');
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/updatepassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPassSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setPassError('Server error. Please try again.');
    }
  };

  const tabs = [
    { id: 'general', icon: <SettingsIcon size={20} />, title: 'General', desc: 'App preferences and theme' },
    { id: 'security', icon: <Shield size={20} />, title: 'Security', desc: 'Password and protection' },
    { id: 'notifications', icon: <Bell size={20} />, title: 'Notifications', desc: 'Alerts and updates' },
    { id: 'ai', icon: <Zap size={20} />, title: 'AI Configuration', desc: 'Models and response styles' }
  ];

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: isMobile ? '10px' : '20px' }}>
      <EtherealField />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ 
          padding: isMobile ? '20px' : '40px', 
          width: '95%', 
          maxWidth: '850px', 
          height: isMobile ? 'auto' : '650px', 
          maxHeight: '95vh',
          zIndex: 1, 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '20px' : '30px',
          overflowY: isMobile ? 'auto' : 'hidden'
        }}
      >
        <div style={{ 
          width: isMobile ? '100%' : '240px', 
          borderRight: isMobile ? 'none' : '1px solid var(--border-glass)', 
          borderBottom: isMobile ? '1px solid var(--border-glass)' : 'none',
          paddingRight: isMobile ? '0' : '20px',
          paddingBottom: isMobile ? '20px' : '0',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: isMobile ? '20px' : '40px' }}>
            <ArrowLeft onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
            <h2 style={{ fontSize: '1.4rem' }}>Settings</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '10px' : '0' }}>
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  padding: '12px 15px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'rgba(124, 77, 255, 0.1)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-secondary)' : 'var(--text-main)'
                }}
              >
                {tab.icon}
                <span style={{ fontSize: '0.95rem', fontWeight: activeTab === tab.id ? '600' : '400' }}>{tab.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, paddingLeft: isMobile ? '0' : '10px', position: 'relative', overflowY: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '25px', color: 'var(--accent-secondary)' }}>
                {tabs.find(t => t.id === activeTab).title}
              </h3>

              {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>INTERFACE THEME</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['dark', 'light', 'system'].map((t) => (
                        <div
                          key={t}
                          onClick={() => handleThemeChange(t)}
                          style={{
                            flex: 1,
                            padding: '15px',
                            borderRadius: '12px',
                            border: `1px solid ${theme === t ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                            background: theme === t ? 'rgba(124, 77, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            transition: '0.3s'
                          }}
                        >
                          {t === 'dark' && <Moon size={20} />}
                          {t === 'light' && <Sun size={20} />}
                          {t === 'system' && <Monitor size={20} />}
                          <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '5px' }}>CHANGE PASSWORD</p>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="glass-panel"
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white', outline: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass-panel"
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white', outline: 'none' }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-panel"
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'white', outline: 'none' }}
                  />
                  {passError && <div style={{ color: '#ff4d4d', fontSize: '0.85rem' }}>{passError}</div>}
                  {passSuccess && <div style={{ color: '#00e5ff', fontSize: '0.85rem' }}>{passSuccess}</div>}
                  <button onClick={handlePasswordChange} className="glass-panel" style={{ padding: '12px', background: 'var(--accent-primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                    Update Password
                  </button>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '4px' }}>Browser Notifications</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Receive alerts for new AI responses.</p>
                    </div>
                    <div
                      onClick={() => {
                        const next = !notifications;
                        setNotifications(next);
                        localStorage.setItem('notifications', next);
                        if (next) {
                          Notification.requestPermission().then(permission => {
                            if (permission === 'granted') new Notification('Ethereal', { body: 'Notifications enabled!' });
                          });
                        }
                      }}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: notifications ? 'var(--accent-primary)' : 'var(--border-glass)', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: notifications ? '23px' : '3px', transition: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>PRIMARY MODEL</p>
                    <div style={{ padding: '15px', borderRadius: '10px', border: '1px solid var(--accent-primary)', background: 'rgba(124, 77, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Zap size={18} color="var(--accent-primary)" />
                        <span>Llama 3.3 (70B Versatile)</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', background: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '4px' }}>ACTIVE</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
