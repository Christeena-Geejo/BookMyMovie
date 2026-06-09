import React from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { CheckCircle, Calendar, Clock, MapPin, ArrowRight, Download } from 'lucide-react';

const Confirmation = ({ 
  confirmedBooking, 
  setView 
}) => {
  const { user, authFetch } = useAuth();
  
  const downloadTicket = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/bookings/${confirmedBooking.id}/pdf/`);
      if (!response.ok) {
        throw new Error('Failed to download PDF ticket');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ticket_${confirmedBooking.id}_${confirmedBooking.movie_title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF ticket:", error);
      alert("Could not download PDF ticket. Please try again.");
    }
  };
  
  if (!confirmedBooking) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p>No confirmed booking details found.</p>
        <button className="btn-primary" onClick={() => setView('home')}>Go Home</button>
      </div>
    );
  }

  const seatsList = confirmedBooking.booking_seats.map(bs => bs.seat_label).join(', ');

  return (
    <div className="container" style={{ paddingBottom: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Success Badge */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2.5rem',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <CheckCircle size={56} color="#10b981" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))' }} />
        <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2.25rem', marginBottom: '0.5rem' }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '450px', margin: '0 auto' }}>
          Your transaction was successful. We have emailed your ticket to <strong style={{ color: 'var(--text-main)' }}>{confirmedBooking.email || user?.email || 'your registered email'}</strong>
        </p>
      </div>

      {/* Ticket Stub Design */}
      <div className="ticket-stub" style={{ width: '100%', maxWidth: '460px', marginBottom: '2.5rem' }}>
        {/* Ticket Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px dashed var(--border-color)',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--primary)'
          }}>
            Movie Ticket
          </span>
          <span style={{
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            fontFamily: 'monospace'
          }}>
            Code: {confirmedBooking.booking_code}
          </span>
        </div>

        {/* Ticket Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Movie</p>
            <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.2 }}>
              {confirmedBooking.movie_title}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <MapPin size={16} color="var(--primary)" style={{ marginTop: '0.2rem' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cinema</p>
              <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{confirmedBooking.cinema_name}</p>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{confirmedBooking.screen_name}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</p>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{confirmedBooking.show_date}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', textAlign: 'right' }}>
              <Clock size={16} color="var(--text-muted)" />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time</p>
                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{confirmedBooking.show_time}</p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            paddingTop: '1rem'
          }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Seats</p>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>{seatsList}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Amount Paid</p>
              <p style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                Rs. {confirmedBooking.total_amount}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div style={{
          borderTop: '1px dashed var(--border-color)',
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* Mock SVG QR Code */}
          <div style={{
            background: '#ffffff',
            padding: '0.75rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              {/* Outer corners */}
              <rect x="0" y="0" width="25" height="25" fill="#000" />
              <rect x="3" y="3" width="19" height="19" fill="#fff" />
              <rect x="7" y="7" width="11" height="11" fill="#000" />

              <rect x="75" y="0" width="25" height="25" fill="#000" />
              <rect x="78" y="3" width="19" height="19" fill="#fff" />
              <rect x="82" y="7" width="11" height="11" fill="#000" />

              <rect x="0" y="75" width="25" height="25" fill="#000" />
              <rect x="3" y="78" width="19" height="19" fill="#fff" />
              <rect x="7" y="82" width="11" height="11" fill="#000" />

              {/* Smaller alignment pattern */}
              <rect x="70" y="70" width="10" height="10" fill="#000" />
              <rect x="72" y="72" width="6" height="6" fill="#fff" />
              <rect x="74" y="74" width="2" height="2" fill="#000" />

              {/* Random QR code pixels */}
              <rect x="35" y="5" width="5" height="5" fill="#000" />
              <rect x="40" y="15" width="5" height="5" fill="#000" />
              <rect x="60" y="10" width="5" height="5" fill="#000" />
              <rect x="50" y="20" width="5" height="10" fill="#000" />
              <rect x="30" y="35" width="10" height="5" fill="#000" />
              <rect x="15" y="45" width="5" height="5" fill="#000" />
              <rect x="45" y="40" width="5" height="5" fill="#000" />
              <rect x="55" y="35" width="10" height="5" fill="#000" />
              <rect x="65" y="45" width="5" height="10" fill="#000" />
              
              <rect x="10" y="60" width="5" height="5" fill="#000" />
              <rect x="35" y="65" width="5" height="5" fill="#000" />
              <rect x="45" y="55" width="10" height="5" fill="#000" />
              
              <rect x="80" y="35" width="5" height="5" fill="#000" />
              <rect x="90" y="40" width="5" height="10" fill="#000" />
              <rect x="85" y="55" width="5" height="5" fill="#000" />
              
              <rect x="50" y="75" width="5" height="10" fill="#000" />
              <rect x="60" y="80" width="10" height="5" fill="#000" />
              <rect x="35" y="85" width="5" height="5" fill="#000" />
            </svg>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Scan at Theatre Entrance
          </span>
        </div>
      </div>

      {/* Primary navigation helper buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={downloadTicket}
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(16, 185, 129, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
          }}
        >
          <Download size={16} />
          <span>Download Ticket</span>
        </button>

        <button 
          onClick={() => setView('my-bookings')} 
          className="btn-secondary"
        >
          View Booking History
        </button>
        
        <button 
          onClick={() => setView('home')} 
          className="btn-primary"
        >
          <span>Explore More Movies</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
