import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Clock, ShieldCheck, Ticket, ArrowLeft } from 'lucide-react';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = ({ 
  pendingBooking, 
  setView, 
  setConfirmedBooking 
}) => {
  const { user, authFetch } = useAuth();
  
  if (!pendingBooking) {
    // Fallback if accessed directly
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p>No active booking session found.</p>
        <button className="btn-primary" onClick={() => setView('home')}>Go Home</button>
      </div>
    );
  }

  const { booking, expires_in_seconds } = pendingBooking;
  const [timeLeft, setTimeLeft] = useState(expires_in_seconds || 300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer hook
  useEffect(() => {
    if (timeLeft <= 0) {
      alert("Session expired! Your locked seats have been released.");
      setView('movie-detail');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    setError('');

    // 1. Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Failed to load Razorpay SDK. Please check your internet connection.");
      setLoading(false);
      return;
    }

    try {
      // 2. Call backend to create Razorpay Order
      const response = await authFetch(`${API_BASE_URL}/api/bookings/create-razorpay-order/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: booking.id
        })
      });

      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.error || "Failed to initiate payment transaction.");
      }

      // Special bypass for local mock keys (so the system is 100% testable out of the box)
      if (orderData.key_id === 'rzp_test_mockKeyId123') {
        setTimeout(async () => {
          try {
            const verifyResponse = await authFetch(`${API_BASE_URL}/api/bookings/verify-razorpay-payment/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                booking_id: booking.id,
                razorpay_payment_id: "pay_mockPaymentId123",
                razorpay_order_id: orderData.razorpay_order_id,
                razorpay_signature: "mock_signature"
              })
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || "Mock verification failed.");
            }

            setConfirmedBooking(verifyData);
            setView('booking-confirmed');
          } catch (err) {
            setError(err.message);
            setLoading(false);
          }
        }, 1500);
        return;
      }

      // 3. Setup Razorpay options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "BookMyMovie",
        description: `Tickets for ${booking.movie_title}`,
        order_id: orderData.razorpay_order_id,
        handler: async function (paymentRes) {
          setLoading(true);
          try {
            // 4. Verify payment on backend
            const verifyResponse = await authFetch(`${API_BASE_URL}/api/bookings/verify-razorpay-payment/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                booking_id: booking.id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_signature: paymentRes.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            setConfirmedBooking(verifyData);
            setView('booking-confirmed');
          } catch (err) {
            setError(err.message);
            setLoading(false);
          }
        },
        prefill: {
          name: user ? user.username : '',
          email: user ? user.email : ''
        },
        theme: {
          color: "#ff0844"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem', maxWidth: '900px' }}>
      {/* Back button */}
      <button 
        onClick={() => setView('seat-selection')} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          marginBottom: '2.0rem',
          cursor: 'pointer',
          fontWeight: 500,
          background: 'none',
          border: 'none',
          padding: 0
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Seat Selection</span>
      </button>

      {/* Expiry Alert banner */}
      <div className="glass" style={{
        borderRadius: '12px',
        padding: '1rem',
        border: '1px solid rgba(217, 119, 6, 0.4)',
        background: 'rgba(217, 119, 6, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={20} color="var(--seat-locked)" />
          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Seats locked! Complete payment before they release.
          </span>
        </div>
        <span style={{ 
          fontFamily: 'var(--font-title)', 
          fontWeight: 800, 
          fontSize: '1.25rem', 
          color: 'var(--seat-locked)' 
        }}>
          {formatTimer(timeLeft)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Left Side - Payment Info / Gateway trigger */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.75rem', marginBottom: '1.5rem' }}>
            Payment Details
          </h2>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '0.75rem',
              color: '#f87171',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <div className="glass" style={{
            padding: '3rem 2rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.5rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 8, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              marginBottom: '0.5rem'
            }}>
              <ShieldCheck size={32} />
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.35rem', marginBottom: '0.5rem' }}>
                Secure Razorpay Payment
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>
                Complete your booking securely via Razorpay. Supports UPI, Google Pay, PhonePe, Debit/Credit Cards, Netbanking, and Wallets.
              </p>
            </div>

            <div style={{
              width: '100%',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'stretch'
            }}>
              <button
                onClick={handleRazorpayPayment}
                disabled={loading || timeLeft <= 0}
                className="btn-primary"
                style={{
                  justifyContent: 'center',
                  padding: '1rem',
                  fontSize: '1.1rem',
                  cursor: (loading || timeLeft <= 0) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing Payment...' : `Pay Rs. ${booking.total_amount} with Razorpay`}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Booking Summary */}
        <div style={{ width: '320px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.75rem', marginBottom: '1.5rem' }}>
            Summary
          </h2>
          
          <div className="glass" style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Movie</p>
              <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.125rem' }}>{booking.movie_title}</h4>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.875rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cinema</p>
                <p style={{ fontWeight: 600 }}>{booking.cinema_name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.screen_name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date & Time</p>
                <p style={{ fontWeight: 600 }}>{booking.show_date}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{booking.show_time}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Seats</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {booking.booking_seats.map(bs => (
                  <span key={bs.id} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: '1px solid var(--border-color)'
                  }}>
                    {bs.seat_label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '1rem',
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Sub Total</span>
              <span style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                Rs. {booking.total_amount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
