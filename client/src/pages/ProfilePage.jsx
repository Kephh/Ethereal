import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Calendar, ShieldCheck, Camera, Edit2, Check, X, Trash2, PowerOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EtherealField from '../components/EtherealField';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [isMobile] = useState(window.innerWidth < 768);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    profilePhoto: user?.profilePhoto || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(null); // 'delete' or 'deactivate'

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/updateprofile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });
      const data = await res.json();
      if (data.success) {
        updateUser(data.user);
        setIsEditing(false);
        setMessage('Profile updated successfully!');
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setMessage('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountAction = async (type) => {
    setLoading(true);
    try {
      const endpoint = type === 'delete' ? 'delete' : 'deactivate';
      const method = type === 'delete' ? 'DELETE' : 'PUT';
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/${endpoint}`, {
        method: method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await res.json();
      if (data.success) {
        logout();
        navigate('/auth');
      } else {
        setMessage(data.message || `Failed to ${type} account`);
      }
    } catch (err) {
      setMessage('Server error. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  return (
    <div style={{ 
      height: '100dvh', 
      width: '100vw', 
      display: 'flex', 
      alignItems: isMobile ? 'flex-start' : 'center', 
      justifyContent: 'center', 
      position: 'relative', 
      padding: isMobile ? '15px 10px' : '20px',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      <EtherealField />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ padding: isMobile ? '20px' : '40px', width: '95%', maxWidth: '550px', zIndex: 1, position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <ArrowLeft onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
            <h2>Profile</h2>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '8px 15px', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setIsEditing(false)}
                style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '8px 15px', color: '#ff4d4d', borderRadius: '8px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
              <button 
                onClick={handleSave}
                disabled={loading}
                style={{ background: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)', padding: '8px 15px', color: 'var(--accent-secondary)', borderRadius: '8px', cursor: 'pointer' }}
              >
                {loading ? '...' : <Check size={18} />}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))', 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden',
              border: '4px solid var(--bg-glass)'
            }}>
              {(editData.profilePhoto || user?.profilePhoto) ? (
                <img src={editData.profilePhoto || user?.profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={60} color="white" />
              )}
            </div>
            {isEditing && (
              <label style={{ 
                position: 'absolute', 
                bottom: '15px', 
                right: '0', 
                background: 'var(--accent-primary)', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}>
                <Camera size={16} color="white" />
                <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
              </label>
            )}
          </div>
          
          {isEditing ? (
            <input 
              value={editData.username}
              onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '8px 15px', color: 'white', borderRadius: '8px', outline: 'none', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
            />
          ) : (
            <h3 style={{ fontSize: '1.5rem' }}>{user?.username}</h3>
          )}
          <p style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '5px' }}>{user?.role?.toUpperCase()}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>BIO</p>
            {isEditing ? (
              <textarea 
                value={editData.bio}
                onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '12px', color: 'white', borderRadius: '8px', outline: 'none', minHeight: '80px', resize: 'none' }}
              />
            ) : (
              <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{user?.bio || 'No bio provided.'}</p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Mail size={18} color="var(--text-dim)" />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>EMAIL ADDRESS</p>
              <p>{user?.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Calendar size={18} color="var(--text-dim)" />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>MEMBER SINCE</p>
              <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'April 2026'}</p>
            </div>
          </div>
        </div>

        {/* Account Management Section */}
        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => setShowConfirm('deactivate')}
            style={{ flex: 1, background: 'transparent', border: '1px solid var(--text-dim)', padding: '10px', color: 'var(--text-dim)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <PowerOff size={16} /> Deactivate
          </button>
          <button 
            onClick={() => setShowConfirm('delete')}
            style={{ flex: 1, background: 'transparent', border: '1px solid #ff4d4d', padding: '10px', color: '#ff4d4d', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '20px' }}
            >
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ marginBottom: '15px' }}>Are you sure?</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '25px' }}>
                  {showConfirm === 'delete' 
                    ? 'This will permanently delete your account and all your chats. This action cannot be undone.' 
                    : 'This will deactivate your account. You will be logged out and cannot log back in until you contact support.'}
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setShowConfirm(null)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px 20px', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleAccountAction(showConfirm)}
                    style={{ background: showConfirm === 'delete' ? '#ff4d4d' : 'var(--accent-primary)', border: 'none', padding: '10px 20px', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Confirm {showConfirm.charAt(0).toUpperCase() + showConfirm.slice(1)}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {message && !showConfirm && (
          <div style={{ marginTop: '20px', textAlign: 'center', color: message.includes('success') ? 'var(--accent-secondary)' : '#ff4d4d', fontSize: '0.9rem' }}>
            {message}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfilePage;
