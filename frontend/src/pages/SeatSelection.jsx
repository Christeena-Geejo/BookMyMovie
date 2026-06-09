import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ArrowLeft, Ticket } from 'lucide-react';

const SeatSelection = ({ 
  selectedShowId, 
  setView, 
  setPendingBooking, 
  setPreviousViewInfo 
}) => {
  const { user, authFetch } = useAuth();
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]); // Array of seat objects
  const [error, setError] = useState('');

  const fetchSeats = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = user 
        ? await authFetch(`${API_BASE_URL}/api/shows/${selectedShowId}/seats/`)
        : await fetch(`${API_BASE_URL}/api/shows/${selectedShowId}/seats/`);
      if (!res.ok) throw new Error("Failed to load seats");
      const data = await res.json();
      setSeats(data);
      // Synchronize selected seats with backend lock state
      const lockedByMe = data.filter(s => s.is_locked_by_me);
      setSelectedSeats(lockedByMe);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedShowId) return;

    fetchSeats();
    
    // Poll the backend every 5 seconds silently
    const interval = setInterval(() => {
      fetchSeats(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedShowId]);

  // Group seats by row
  const seatsByRow = {};
  seats.forEach(seat => {
    if (!seatsByRow[seat.row_name]) {
      seatsByRow[seat.row_name] = [];
    }
    seatsByRow[seat.row_name].push(seat);
  });

  // Sort rows alphabetically descending (A at the bottom/front, VIP J/K at the top/back)
  const sortedRowNames = Object.keys(seatsByRow).sort((a, b) => b.localeCompare(a));

  const handleSeatClick = async (seat) => {
    if (!user) {
      setPreviousViewInfo({
        view: 'seat-selection',
        showId: selectedShowId,
        selectedSeatIds: []
      });
      setView('login');
      return;
    }

    if (seat.status !== 'AVAILABLE' && !seat.is_locked_by_me) return;

    const isAlreadySelected = selectedSeats.some(s => s.id === seat.id);
    const action = isAlreadySelected ? 'unlock' : 'lock';

    if (action === 'lock' && selectedSeats.length >= 10) {
      alert("You can select a maximum of 10 seats.");
      return;
    }

    setError('');
    try {
      const response = await authFetch(`${API_BASE_URL}/api/bookings/toggle-lock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          show_id: selectedShowId,
          seat_id: seat.id,
          action: action
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} seat.`);
      }

      if (action === 'lock') {
        const updatedSeat = { ...seat, status: 'LOCKED', is_locked_by_me: true };
        setSelectedSeats([...selectedSeats, updatedSeat]);
        setSeats(seats.map(s => s.id === seat.id ? updatedSeat : s));
      } else {
        const updatedSeat = { ...seat, status: 'AVAILABLE', is_locked_by_me: false };
        setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
        setSeats(seats.map(s => s.id === seat.id ? updatedSeat : s));
      }
    } catch (err) {
      setError(err.message);
      fetchSeats();
    }
  };

  const handleProceed = async () => {
    if (selectedSeats.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const response = await authFetch(`${API_BASE_URL}/api/bookings/active-pending/?show_id=${selectedShowId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to proceed to payment.");
      }

      // Save locked booking details and proceed to checkout
      setPendingBooking(data);
      setView('checkout');
    } catch (err) {
      setError(err.message);
      fetchSeats();
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedSeats.reduce((sum, seat) => sum + parseFloat(seat.price), 0);

  if (loading && seats.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div style={{ height: '350px' }} className="skeleton" />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '7rem' }}>
      {/* Back button */}
      <button 
        onClick={() => setView('movie-detail')} 
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
        <span>Back to Cinema Shows</span>
      </button>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Select Seats
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Click on available seats to select them. Max 10 tickets per booking.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          color: '#f87171',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {/* Main Seat Layout Grid */}
      <div className="glass" style={{
        borderRadius: '16px',
        padding: '3rem 2rem',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflowX: 'auto',
        marginBottom: '2rem'
      }}>
        {/* Screen */}
        <div className="cinema-screen-container" style={{ width: '100%', maxWidth: '600px' }}>
          <div className="cinema-screen"></div>
          <div className="screen-text">All Eyes This Way</div>
        </div>

        {/* Seats Grid */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.50rem',
          marginTop: '2rem',
          minWidth: '450px'
        }}>
          {sortedRowNames.map(rowName => {
            const seatsInRow = seatsByRow[rowName];
            return (
              <div key={rowName} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Row Label (Left) */}
                <span style={{ 
                  width: '20px', 
                  fontSize: '0.875rem', 
                  fontWeight: 700, 
                  color: 'var(--text-muted)', 
                  textAlign: 'center' 
                }}>
                  {rowName}
                </span>

                {/* Seat buttons */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {seatsInRow.map(seat => {
                    const isSelected = selectedSeats.some(s => s.id === seat.id);
                    const isBookedOrOtherLocked = seat.status === 'BOOKED' || (seat.status === 'LOCKED' && !seat.is_locked_by_me);
                    
                    let bg = 'var(--seat-available)';
                    let border = '1px solid rgba(255,255,255,0.1)';
                    let cursor = 'pointer';
                    let opacity = 1;
                    
                    if (seat.status === 'LOCKED') {
                      if (seat.is_locked_by_me) {
                        bg = 'var(--accent-gradient)';
                        border = '1px solid transparent';
                        cursor = 'pointer';
                      } else {
                        bg = 'var(--seat-booked)';
                        border = '1px solid rgba(255,255,255,0.08)';
                        cursor = 'not-allowed';
                        opacity = 0.5;
                      }
                    } else if (seat.status === 'BOOKED') {
                      bg = 'var(--seat-booked)';
                      border = '1px solid rgba(255,255,255,0.08)';
                      cursor = 'not-allowed';
                      opacity = 0.5;
                    }
                    
                    if (isSelected) {
                      bg = 'var(--accent-gradient)';
                      border = '1px solid transparent';
                    }

                    return (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status !== 'AVAILABLE' && !seat.is_locked_by_me}
                        title={`Seat ${rowName}${seat.column_number} - Rs. ${seat.price}`}
                        style={{
                          width: '26px',
                          height: '26px',
                          background: bg,
                          border: border,
                          borderRadius: '6px',
                          cursor: cursor,
                          opacity: opacity,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          color: isSelected ? '#fff' : (isBookedOrOtherLocked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)'),
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (seat.status === 'AVAILABLE' && !isSelected) {
                            e.currentTarget.style.borderColor = 'var(--primary)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (seat.status === 'AVAILABLE' && !isSelected) {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                      >
                        {isBookedOrOtherLocked ? '×' : seat.column_number}
                      </button>
                    );
                  })}
                </div>

                {/* Row Label (Right) */}
                <span style={{ 
                  width: '20px', 
                  fontSize: '0.875rem', 
                  fontWeight: 700, 
                  color: 'var(--text-muted)', 
                  textAlign: 'center' 
                }}>
                  {rowName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginTop: '3.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontSize: '0.825rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '18px', height: '18px', background: 'var(--seat-available)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}></div>
            <span style={{ color: 'var(--text-muted)' }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '18px', height: '18px', background: 'var(--accent-gradient)', borderRadius: '4px' }}></div>
            <span style={{ color: 'var(--text-muted)' }}>Selected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '18px',
              height: '18px',
              background: 'var(--seat-booked)',
              borderRadius: '4px',
              border: '1px solid rgba(255,255,255,0.08)',
              opacity: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.675rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)'
            }}>×</div>
            <span style={{ color: 'var(--text-muted)' }}>Booked</span>
          </div>
        </div>
      </div>

      {/* Selected Seats Details & Checkout Button (Sticky Footer) */}
      {selectedSeats.length > 0 && (
        <div className="glass" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 0',
          borderTop: '1px solid var(--border-color)',
          zIndex: 90,
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div className="container" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Selected Seats ({selectedSeats.length})
              </p>
              <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.25rem' }}>
                {selectedSeats.map(s => `${s.row_name}${s.column_number}`).join(', ')}
              </h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Total Price
                </p>
                <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>
                  Rs. {totalAmount}
                </h3>
              </div>
              <button 
                onClick={handleProceed}
                disabled={loading}
                className="btn-primary"
                style={{ minWidth: '180px', justifyContent: 'center' }}
              >
                <Ticket size={18} />
                <span>{user ? 'Pay' : 'Sign in to Pay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
