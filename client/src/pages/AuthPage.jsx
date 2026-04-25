import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EtherealField from '../components/EtherealField';

const AuthPage = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      if (isRegistering) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      // Full reload to ensure clean global state and theme application
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '20px' }}>
      <EtherealField />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{ padding: '30px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1 }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>
          {isRegistering ? 'Join Ethereal' : 'Access Ethereal'}
        </h2>

        {isRegistering && (
          <input
            className="glass-panel"
            placeholder="Username"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '12px', color: 'white', borderRadius: '8px', outline: 'none' }}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          className="glass-panel"
          placeholder="Email"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '12px', color: 'white', borderRadius: '8px', outline: 'none' }}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="glass-panel"
          type="password"
          placeholder="Password"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '12px', color: 'white', borderRadius: '8px', outline: 'none' }}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!isRegistering && (
          <p 
            onClick={() => navigate('/forgot-password')}
            style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: '-10px', cursor: 'pointer' }}
          >
            Forgot Password?
          </p>
        )}
        
        {error && (
          <div style={{ color: '#ff4d4d', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 77, 77, 0.2)' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          style={{ background: 'var(--accent-primary)', border: 'none', padding: '14px', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isRegistering ? 'Sign Up' : 'Login'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
        </div>

        <button
          onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--border-glass)', 
            padding: '12px', 
            color: 'white', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px' 
          }}
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '18px' }} />
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          <span
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            style={{ color: 'var(--accent-secondary)', marginLeft: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            {isRegistering ? 'Login' : 'Sign Up'}
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
