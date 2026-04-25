import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import EtherealField from '../components/EtherealField';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/auth/resetpassword/${token}`, { password });
      setMessage('Password reset successful!');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100dvh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '20px', overflow: 'hidden' }}>
      <EtherealField />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ padding: '30px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1 }}
      >
        <h2 style={{ textAlign: 'center' }}>Set New Password</h2>

        <input
          className="glass-panel"
          type="password"
          placeholder="New Password"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '12px', color: 'white', borderRadius: '8px', outline: 'none' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="glass-panel"
          type="password"
          placeholder="Confirm New Password"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '12px', color: 'white', borderRadius: '8px', outline: 'none' }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {message && <div style={{ color: '#4ade80', fontSize: '0.85rem', textAlign: 'center' }}>{message}</div>}
        {error && <div style={{ color: '#ff4d4d', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading || !password}
          style={{ background: 'var(--accent-primary)', border: 'none', padding: '14px', color: 'white', borderRadius: '8px', cursor: (loading || !password) ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: (loading || !password) ? 0.7 : 1 }}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}
            />
          ) : (
            'Reset Password'
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
