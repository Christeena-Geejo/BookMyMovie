import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../context/AuthContext';
import { CheckCircle2, XCircle, AlertCircle, Calendar, Clock, MapPin, Film, ArrowLeft } from 'lucide-react';

const TicketVerify = ({ bookingCode, onClose, closeText = "Go to Home Page" }) => {
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [errorType, setErrorType] = useState(''); // 'ALREADY_SCANNED', 'DATE_MISMATCH', 'UNPAID', 'INVALID', 'ERROR'
  const [errorMessage, setErrorMessage] = useState('');
  const [scannedAt, setScannedAt] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!bookingCode) {
      setStatus('error');
      setErrorType('INVALID');
      setErrorMessage('No ticket code provided.');
      return;
    }

    const verifyTicket = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings/verify/${bookingCode}/`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setBooking(data.booking);
        } else {
          setStatus('error');
          setErrorType(data.status || 'ERROR');
          setErrorMessage(data.error || 'Failed to verify ticket.');
          setScannedAt(data.scanned_at || null);
          if (data.booking) {
            setBooking(data.booking);
          }
        }
      } catch (err) {
        setStatus('error');
        setErrorType('ERROR');
        setErrorMessage('Failed to connect to verification server: ' + err.message);
      }
    };

    verifyTicket();
  }, [bookingCode]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (status === 'loading') {
    return (
      <div className="container" style={{ padding: '8rem 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
        <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: '1.25rem', color: 'var(--text-muted)' }}>
          Verifying Ticket Signature...
        </h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Verification Card */}
      <div className="glass" style={{
        width: '100%',
        maxWidth: '520px',
        borderRadius: '24px',
        padding: '3rem 2rem',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Status Icon Header */}
        {status === 'success' ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <CheckCircle2 size={64} color="#10b981" style={{ filter: 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))' }} />
            <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2rem', color: '#10b981' }}>
              ENTRY APPROVED
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '-0.5rem' }}>
              Code: <strong style={{ color: 'var(--text-main)' }}>{bookingCode}</strong>
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {errorType === 'ALREADY_SCANNED' ? (
              <XCircle size={64} color="#ef4444" style={{ filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.4))' }} />
            ) : (
              <AlertCircle size={64} color="#f59e0b" style={{ filter: 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.4))' }} />
            )}
            <h1 style={{ 
              fontFamily: 'var(--font-title)', 
              fontWeight: 800, 
              fontSize: '2rem', 
              color: errorType === 'ALREADY_SCANNED' ? '#ef4444' : '#f59e0b' 
            }}>
              ENTRY DENIED
            </h1>
            <h4 style={{ 
              fontFamily: 'var(--font-title)', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              color: 'var(--text-main)',
              marginTop: '-0.5rem',
              textTransform: 'uppercase'
            }}>
              {errorType === 'ALREADY_SCANNED' ? 'Already Scanned' : errorType.replace('_', ' ')}
            </h4>
            <p style={{ color: '#ef4444', fontSize: '0.9rem', maxWidth: '350px', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            {scannedAt && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.825rem',
                color: '#f87171',
                marginTop: '0.5rem'
              }}>
                <strong>First Scanned At:</strong><br />
                {formatDateTime(scannedAt)}
              </div>
            )}
          </div>
        )}

        {/* Ticket Details Panel */}
        {booking && (
          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Film size={18} color="var(--primary)" style={{ marginTop: '0.2rem' }} />
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Movie</p>
                <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>
                  {booking.movie_title}
                </h4>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <MapPin size={18} color="var(--primary)" style={{ marginTop: '0.2rem' }} />
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cinema & Screen</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>{booking.cinema_name}</p>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{booking.screen_name}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</p>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{booking.show_date}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', textAlign: 'right' }}>
                <Clock size={16} color="var(--text-muted)" />
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</p>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{booking.show_time}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Seats</p>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {booking.booking_seats.map(bs => (
                    <span key={bs.id} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border: '1px solid var(--border-color)'
                    }}>
                      {bs.seat_label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer</p>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{booking.username}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <button 
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', gap: '0.5rem', padding: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>{closeText}</span>
        </button>
      </div>
    </div>
  );
};

export default TicketVerify;
