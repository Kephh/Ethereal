import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import EtherealField from '../components/EtherealField';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/auth/verify/${token}`);
        setStatus('success');
        setTimeout(() => navigate('/auth'), 3000);
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.message || 'Verification failed');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '20px' }}>
      <EtherealField />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{ padding: '40px', width: '90%', maxWidth: '400px', textAlign: 'center', zIndex: 1 }}
      >
        {status === 'verifying' && (
          <>
            <h2>Verifying...</h2>
            <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>Please wait while we confirm your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 style={{ color: '#4ade80' }}>Verified!</h2>
            <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>Your email has been successfully verified. Redirecting to login...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 style={{ color: '#ff4d4d' }}>Failed</h2>
            <p style={{ color: 'var(--text-dim)', marginTop: '10px' }}>{error}</p>
            <button
              onClick={() => navigate('/auth')}
              style={{ background: 'var(--accent-primary)', border: 'none', padding: '12px 24px', color: 'white', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
