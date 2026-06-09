import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Film, ArrowLeft, Ticket } from 'lucide-react';

const MyBookings = ({ setView }) => {
  const { authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/bookings/my-bookings/`);
        if (!response.ok) throw new Error("Failed to retrieve booking history.");
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return '#10b981';
      case 'PENDING': return '#f59e0b';
      default: return '#ef4444';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'rgba(16, 185, 129, 0.15)';
      case 'PENDING': return 'rgba(245, 158, 11, 0.15)';
      default: return 'rgba(239, 68, 68, 0.15)';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div style={{ height: '300px' }} className="skeleton" />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '5rem', maxWidth: '800px' }}>
      {/* Back button */}
      <button 
        onClick={() => setView('home')} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          marginBottom: '2rem',
          cursor: 'pointer',
          fontWeight: 500
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.75rem', marginBottom: '2rem' }}>
        Your Booking History
      </h2>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          color: '#f87171',
          marginBottom: '2rem'
        }}>
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="glass" style={{
          padding: '4rem 2rem',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Ticket size={48} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
          <h3>No bookings found</h3>
          <p style={{ marginTop: '0.5rem' }}>You haven't booked any movie tickets yet.</p>
          <button 
            className="btn-primary" 
            onClick={() => setView('home')}
            style={{ marginTop: '1.5rem' }}
          >
            Explore Movies
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bookings.map(booking => {
            const seatsStr = booking.booking_seats.map(bs => bs.seat_label).join(', ');
            return (
              <div 
                key={booking.id} 
                className="glass" 
                style={{
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  position: 'relative'
                }}
              >
                {/* Left side details */}
                <div style={{ display: 'flex', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
                  {/* Decorative movie icon card */}
                  <div style={{
                    width: '60px',
                    height: '80px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2e0854 0%, #ff0844 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Film size={24} color="#fff" />
                  </div>

                  <div>
                    <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                      {booking.movie_title}
                    </h3>
                    {booking.booking_code && (
                      <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Code: {booking.booking_code}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <MapPin size={12} color="var(--primary)" />
                      <span>{booking.cinema_name} ({booking.screen_name})</span>
                    </div>
                    
                    {/* Seats details */}
                    <div style={{ fontSize: '0.825rem' }}>
                      Seats: <strong style={{ color: 'var(--text-main)' }}>{seatsStr}</strong>
                    </div>
                  </div>
                </div>

                {/* Middle info - Date and time */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={14} color="var(--text-muted)" />
                    <span>{booking.show_date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} color="var(--text-muted)" />
                    <span>{booking.show_time}</span>
                  </div>
                </div>

                {/* Right side info - Pricing & Status badge */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '0.5rem',
                  minWidth: '120px'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-title)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: 'var(--primary)'
                  }}>
                    Rs. {booking.total_amount}
                  </span>

                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.50rem',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    color: getStatusColor(booking.status),
                    background: getStatusBg(booking.status),
                    border: `1px solid ${getStatusColor(booking.status)}33`
                  }}>
                    {booking.status === 'PENDING' ? 'PENDING PAYMENT' : booking.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
