import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, LogOut, Send, Menu, Plus, User, Settings, PieChart, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import EtherealField from '../components/EtherealField';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop, keep sidebar open. On mobile, close it by default if width changed significantly
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Ethereal AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [deletingChatId, setDeletingChatId] = useState(null);

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        if (activeConversationId === id) {
          setActiveConversationId(null);
          setMessages([{ role: 'assistant', content: 'Hello! I am your Ethereal AI assistant. How can I help you today?' }]);
        }
        fetchHistory();
        setDeletingChatId(null);
      }
    } catch (err) { }
  };

  const fetchHistory = async () => {
    try {
      console.log(`${import.meta.env.VITE_API_URL}/chat/history`);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/chat/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setHistory(data.conversations);
    } catch (err) { }
  };

  useEffect(() => {
    if (user) fetchHistory();
  }, [user?.id]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: input,
          conversationId: activeConversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      // Handle Filtered (Irrelevant) Questions
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.isFiltered) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
          return;
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };
      let isFirstChunk = true;

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);

              if (data.conversationId && isFirstChunk) {
                setActiveConversationId(data.conversationId);
                isFirstChunk = false;
                continue;
              }

              if (data.content) {
                assistantMessage.content += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              }
            } catch (e) { }
          }
        }
      }
      fetchHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <EtherealField />

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 90 }}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass-panel sidebar"
            style={{
              width: isMobile ? '280px' : '280px',
              margin: isMobile ? '0' : '12px',
              marginRight: isMobile ? '0' : '6px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              position: isMobile ? 'fixed' : 'relative',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 100,
              height: isMobile ? '100dvh' : 'calc(100vh - 24px)',
              borderRadius: isMobile ? '0 20px 20px 0' : '20px'
            }}
          >
            <div className="sidebar-header" style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--border-glass)'
                }}>
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Me" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={18} color="white" />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.2' }}>Ethereal</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: '600' }}>@{user?.username}</span>
                </div>
              </div>
              {isMobile && (
                <X
                  size={20}
                  onClick={() => setSidebarOpen(false)}
                  style={{ cursor: 'pointer', color: 'var(--text-dim)', transition: '0.2s' }}
                  onMouseOver={(e) => e.target.style.color = 'white'}
                  onMouseOut={(e) => e.target.style.color = 'var(--text-dim)'}
                />
              )}
            </div>

            <button
              onClick={() => {
                setActiveConversationId(null);
                setMessages([{ role: 'assistant', content: 'Hello! I am your Ethereal AI assistant. How can I help you today?' }]);
              }}
              className="glass-panel new-chat-btn"
              style={{ padding: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}
            >
              <Plus size={18} /> New Chat
            </button>

            <div className="history" style={{ flex: 1, overflowY: 'auto' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '10px' }}>Recent Chats</p>
              {history.map(chat => (
                <div
                  key={chat._id}
                  onClick={() => {
                    setActiveConversationId(chat._id);
                    setMessages(chat.messages);
                  }}
                  className={`history-item ${activeConversationId === chat._id ? 'active' : ''}`}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeConversationId === chat._id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                    fontSize: '0.9rem',
                    marginBottom: '5px',
                    border: activeConversationId === chat._id ? '1px solid var(--border-glass)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <MessageSquare size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
                  </div>

                  {deletingChatId === chat._id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <Check
                        size={14}
                        style={{ color: '#00e5ff', cursor: 'pointer' }}
                        onClick={(e) => handleDeleteChat(e, chat._id)}
                      />
                      <X
                        size={14}
                        style={{ color: 'white', cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); setDeletingChatId(null); }}
                      />
                    </div>
                  ) : (
                    <Trash2
                      size={14}
                      className="delete-icon"
                      onClick={(e) => { e.stopPropagation(); setDeletingChatId(chat._id); }}
                      style={{ color: '#ff4d4d', transition: '0.2s', opacity: 0.6, cursor: 'pointer' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="sidebar-nav" style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '15px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="nav-item" style={{ padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <User size={18} /> Profile
                </div>
              </Link>
              <Link to="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="nav-item" style={{ padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <Settings size={18} /> Settings
                </div>
              </Link>
              <div onClick={() => { logout(); navigate('/auth'); }} style={{ padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4d4d', fontSize: '0.9rem', cursor: 'pointer' }}>
                <LogOut size={18} /> Logout
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="chat-main" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        margin: isMobile ? '8px' : '12px',
        marginLeft: (!isMobile && isSidebarOpen) ? '6px' : (isMobile ? '8px' : '12px'),
        height: isMobile ? 'calc(100% - 16px)' : 'auto',
        overflow: 'hidden'
      }}>
        <header className="glass-panel" style={{ padding: isMobile ? '12px 15px' : '15px 25px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {(isMobile || !isSidebarOpen) && <Menu size={20} onClick={() => setSidebarOpen(true)} style={{ cursor: 'pointer' }} />}
            <span style={{ fontWeight: '600', fontSize: isMobile ? '0.9rem' : '1rem' }}>Llama 3.3 (Versatile)</span>
          </div>
          <div style={{ color: 'var(--accent-secondary)', fontSize: '0.7rem', fontWeight: '500' }}>ONLINE</div>
        </header>

        <div className="messages-container" style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '10px' : '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: isMobile ? '90%' : '80%',
                padding: isMobile ? '10px 16px' : '14px 20px',
                borderRadius: '16px',
                background: msg.role === 'user' ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-glass)',
                border: msg.role === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}
            >
              <div className="markdown-container">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="input-container" style={{ padding: isMobile ? '10px' : '20px' }}>
          <div className="glass-panel" style={{ padding: isMobile ? '5px 15px' : '10px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message Ethereal..."
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', padding: '10px', fontSize: isMobile ? '0.9rem' : '1rem' }}
            />
            <button
              onClick={handleSend}
              style={{ background: 'var(--accent-primary)', border: 'none', padding: isMobile ? '8px' : '10px', borderRadius: '10px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={isMobile ? 16 : 18} />
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '10px' }}>
            Ethereal AI may produce inaccurate information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
