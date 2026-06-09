import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Film, User, Search, MapPin, Ticket, Shield } from 'lucide-react';


const Header = ({ 
  selectedCity, 
  setSelectedCity, 
  cities, 
  setView, 
  searchQuery, 
  setSearchQuery 
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '1rem 0',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '2rem'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        {/* Logo */}
        <div 
          onClick={() => setView('home')} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <div style={{
            background: 'var(--accent-gradient)',
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Film size={20} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 800,
            fontSize: '1.25rem',
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            BookMyMovie
          </span>
        </div>

        {/* Location & Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flex: 1,
          maxWidth: '500px'
        }}>
          {/* City Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            cursor: 'pointer'
          }}>
            <MapPin size={16} color="var(--primary)" />
            <select
              value={selectedCity || ''}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: 'var(--bg-dark)' }}>Select City</option>
              {cities.map(city => (
                <option key={city} value={city} style={{ background: 'var(--bg-dark)' }}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: 1
          }}>
            <Search size={16} color="var(--text-muted)" style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)'
            }} />
            <input
              type="text"
              placeholder="Search for movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem 1rem 0.5rem 2.25rem',
                fontSize: '0.875rem',
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'var(--transition)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>
        </div>

        {/* User Auth Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {user ? (
            <>
              {user.is_cinema_manager && (
                <div 
                  onClick={() => setView('organizer-dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 8, 68, 0.1)',
                    border: '1px solid rgba(255, 8, 68, 0.2)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 8, 68, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 8, 68, 0.1)'}
                >
                  <Shield size={16} color="var(--primary)" />
                  <span>Manager Panel</span>
                </div>
              )}
              <div 
                onClick={() => setView('my-bookings')}

                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <Ticket size={16} color="var(--primary)" />
                <span>Bookings</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)'
              }}>
                <User size={16} />
                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{user.username}</span>
              </div>
              <button 
                onClick={() => { logout(); setView('home'); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button 
              className="btn-primary" 
              onClick={() => setView('login')}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.875rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
