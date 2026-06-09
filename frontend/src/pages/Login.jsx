import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Film, User, Lock, AlertCircle } from 'lucide-react';

const Login = ({ 
  setView, 
  previousViewInfo, 
  setSelectedShowId,
  setSelectedSeats 
}) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(username, password);
    if (res.success) {
      // If we came here from a seat locking action, redirect back
      if (previousViewInfo && previousViewInfo.view === 'seat-selection') {
        setSelectedShowId(previousViewInfo.showId);
        setView('seat-selection');
      } else {
        setView('home');
      }
    } else {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 0',
      minHeight: '70vh'
    }}>
      <div className="glass" style={{
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '420px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'var(--accent-gradient)',
            padding: '0.5rem',
            borderRadius: '8px',
            marginBottom: '0.75rem'
          }}>
            <Film size={24} color="#fff" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.75rem' }}>
            Sign In
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Access booking features and locking system
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '0.75rem',
            color: '#f87171',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.75rem 0.75rem 0.75rem 2.25rem',
                  color: 'var(--text-main)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.75rem 0.75rem 0.75rem 2.25rem',
                  color: 'var(--text-main)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              marginTop: '1rem',
              justifyContent: 'center',
              padding: '0.875rem'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Link to Sign up */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: 'var(--text-muted)'
        }}>
          Don't have an account?{' '}
          <button 
            onClick={() => setView('signup')}
            style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
