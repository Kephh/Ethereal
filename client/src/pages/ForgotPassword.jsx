import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import EtherealField from '../components/EtherealField';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgotpassword`, { email });
      setMessage('Reset link sent! Please check your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link');
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
        <h2 style={{ textAlign: 'center' }}>Reset Password</h2>
        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          Enter your email and we'll send you a link to get back into your account.
        </p>

        <input
          className="glass-panel"
          placeholder="Enter your email"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '12px', color: 'white', borderRadius: '8px', outline: 'none' }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {message && <div style={{ color: '#4ade80', fontSize: '0.85rem', textAlign: 'center' }}>{message}</div>}
        {error && <div style={{ color: '#ff4d4d', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading || !email}
          style={{ background: 'var(--accent-primary)', border: 'none', padding: '14px', color: 'white', borderRadius: '8px', cursor: (loading || !email) ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: (loading || !email) ? 0.7 : 1 }}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}
            />
          ) : (
            'Send Reset Link'
          )}
        </button>

        <p 
          onClick={() => navigate('/auth')}
          style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--accent-secondary)', cursor: 'pointer' }}
        >
          Back to Login
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
