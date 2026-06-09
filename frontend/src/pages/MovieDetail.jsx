import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Calendar, Clock, MapPin, ArrowLeft, Star, MessageSquare, Send, AlertCircle } from 'lucide-react';

const MovieDetail = ({ 
  selectedMovieId, 
  selectedCity, 
  setView, 
  setSelectedShowId 
}) => {
  const { user, authFetch } = useAuth();
  const [movie, setMovie] = useState(null);
  const [cinemaShows, setCinemaShows] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingShows, setLoadingShows] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Create 7 dates starting today
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const formatDateValue = (date) => {
    return date.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(formatDateValue(dates[0]));

  useEffect(() => {
    if (!selectedMovieId) return;

    const fetchMovieDetail = async () => {
      setLoadingMovie(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/movies/${selectedMovieId}/`);
        const data = await res.json();
        setMovie(data);
      } catch (err) {
        console.error("Error fetching movie details:", err);
      } finally {
        setLoadingMovie(false);
      }
    };

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/movies/${selectedMovieId}/reviews/`);
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchMovieDetail();
    fetchReviews();
  }, [selectedMovieId]);

  useEffect(() => {
    if (!selectedMovieId || !selectedCity || !selectedDate) return;

    const fetchShows = async () => {
      setLoadingShows(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/movies/${selectedMovieId}/shows/?location=${selectedCity}&date=${selectedDate}`
        );
        const data = await res.json();
        setCinemaShows(data);
      } catch (err) {
        console.error("Error fetching shows:", err);
      } finally {
        setLoadingShows(false);
      }
    };

    fetchShows();
  }, [selectedMovieId, selectedCity, selectedDate]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!reviewComment.trim()) {
      setReviewError("Please write a comment.");
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    try {
      const response = await authFetch(`${API_BASE_URL}/api/movies/${selectedMovieId}/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(Array.isArray(data) ? data[0] : (data.detail || "Failed to post review."));
      }

      setReviewComment('');
      setReviewRating(5);
      
      // Refresh movie detail stats (average rating)
      const movieRes = await fetch(`${API_BASE_URL}/api/movies/${selectedMovieId}/`);
      const movieData = await movieRes.json();
      setMovie(movieData);

      // Refresh reviews list
      const reviewsRes = await fetch(`${API_BASE_URL}/api/movies/${selectedMovieId}/reviews/`);
      const reviewsData = await reviewsRes.json();
      setReviews(reviewsData);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDayNumber = (date) => {
    return date.toLocaleDateString('en-US', { day: '2-digit' });
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Convert time to 12h format
  const formatTime12h = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    let hr = parseInt(hours);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    hr = hr ? hr : 12; 
    return `${hr}:${minutes} ${ampm}`;
  };

  // Users can submit multiple reviews

  if (loadingMovie || !movie) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <div style={{ height: '300px' }} className="skeleton" />
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
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
          fontWeight: 500,
          transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-main)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={16} />
        <span>Back to Movies</span>
      </button>

      {/* Movie Info Section */}
      <div className="glass" style={{
        borderRadius: '16px',
        padding: '2.5rem',
        marginBottom: '3.5rem',
        display: 'flex',
        gap: '2.5rem',
        flexWrap: 'wrap',
        background: 'linear-gradient(135deg, rgba(25, 28, 39, 0.4) 0%, rgba(10, 11, 15, 0.9) 100%)',
        border: '1px solid var(--border-color)'
      }}>
        {/* Left Card Cover */}
        <div style={{
          width: '200px',
          height: '280px',
          background: 'linear-gradient(135deg, #2e0854 0%, #ff0844 100%)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: '#fff',
          textAlign: 'center',
          padding: '1.5rem'
        }}>
          {movie.title}
        </div>

        {/* Right Info */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2.5rem', marginBottom: '0.75rem', lineHeight: 1.1 }}>
              {movie.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span style={{ background: 'rgba(255, 8, 68, 0.15)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                {movie.language}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                {movie.genre}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> {movie.duration_minutes} mins
              </span>
              {/* Avg Rating Badge */}
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem', 
                color: '#fbbf24', 
                fontWeight: 700, 
                fontSize: '0.875rem',
                background: 'rgba(251, 191, 36, 0.1)',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px'
              }}>
                <Star size={14} fill="#fbbf24" color="#fbbf24" />
                {movie.average_rating > 0 ? `${movie.average_rating} / 5` : 'No reviews'} ({movie.reviews_count})
              </span>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {movie.description}
            </p>
          </div>
          
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Released: <strong style={{ color: 'var(--text-main)' }}>{movie.release_date}</strong>
          </div>
        </div>
      </div>

      {/* Date Selector Tabs */}
      <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.25rem' }}>
        Select Date & Showtimes
      </h2>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
        marginBottom: '2.5rem',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {dates.map((date, idx) => {
          const dateVal = formatDateValue(date);
          const isSelected = selectedDate === dateVal;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(dateVal)}
              className={isSelected ? "" : "glass"}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0.75rem 1.25rem',
                borderRadius: '10px',
                minWidth: '70px',
                cursor: 'pointer',
                transition: 'var(--transition)',
                background: isSelected ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.02)',
                border: isSelected ? '1px solid transparent' : '1px solid var(--border-color)',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <span style={{ fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                {getDayName(date)}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0.1rem 0' }}>
                {getDayNumber(date)}
              </span>
              <span style={{ fontSize: '0.675rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                {getMonthName(date)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Showtimes Listings */}
      {loadingShows ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
          <div style={{ height: '80px' }} className="skeleton" />
          <div style={{ height: '80px' }} className="skeleton" />
        </div>
      ) : cinemaShows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', marginBottom: '4rem' }}>
          <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p style={{ fontSize: '1.125rem' }}>No shows scheduled at any theatres in {selectedCity} on this date.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '4rem' }}>
          {cinemaShows.map(cinema => (
            <div 
              key={cinema.cinema_id} 
              className="glass" 
              style={{
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid var(--border-color)'
              }}
            >
              {/* Cinema info */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <MapPin size={18} color="var(--primary)" style={{ marginTop: '0.2rem' }} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.125rem' }}>
                    {cinema.cinema_name}
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    {cinema.address}
                  </p>
                </div>
              </div>

              {/* Showtimes buttons */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {cinema.shows.map(show => (
                  <button
                    key={show.id}
                    onClick={() => {
                      setSelectedShowId(show.id);
                      setView('seat-selection');
                    }}
                    style={{
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '110px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.background = 'rgba(255, 8, 68, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {formatTime12h(show.start_time)}
                    </span>
                    <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {show.screen_name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Section */}
      <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={20} color="var(--primary)" />
        <span>Reviews & Ratings</span>
      </h2>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left Side: Existing Reviews List */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loadingReviews ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '70px' }} className="skeleton" />
              <div style={{ height: '70px' }} className="skeleton" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="glass" style={{ padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>
              No reviews written yet. Be the first to review this movie!
            </div>
          ) : (
            reviews.map(review => (
              <div 
                key={review.id}
                className="glass"
                style={{
                  borderRadius: '12px',
                  padding: '1.25rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{review.username}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', color: '#fbbf24', fontSize: '0.825rem', fontWeight: 600 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={12} fill={i < review.rating ? '#fbbf24' : 'transparent'} color="#fbbf24" />
                    ))}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  "{review.comment}"
                </p>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', alignSelf: 'flex-end' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Right Side: Write Review Form */}
        <div style={{ width: '320px', position: 'sticky', top: '100px' }}>
          <div className="glass" style={{
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}>
              Write a Review
            </h3>

            {!user ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
                <p style={{ marginBottom: '1rem' }}>You must be signed in to submit a rating and review.</p>
                <button 
                  onClick={() => setView('login')}
                  className="btn-primary" 
                  style={{ padding: '0.5rem 1rem', width: '100%', justifyContent: 'center', fontSize: '0.825rem' }}
                >
                  Sign In Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviewError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    padding: '0.5rem',
                    color: '#f87171',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <AlertCircle size={12} />
                    <span>{reviewError}</span>
                  </div>
                )}

                {/* Star Rating selector */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    Your Rating
                  </label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        style={{
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          background: 'none',
                          border: 'none',
                          padding: '2px',
                          outline: 'none'
                        }}
                      >
                        <Star
                          size={24}
                          fill={star <= reviewRating ? '#fbbf24' : 'transparent'}
                          color={star <= reviewRating ? '#fbbf24' : 'var(--text-muted)'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Text Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Comment
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Describe your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      color: 'var(--text-main)',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary"
                  style={{
                    padding: '0.625rem',
                    justifyContent: 'center',
                    width: '100%',
                    fontSize: '0.825rem'
                  }}
                >
                  <Send size={14} />
                  <span>{submittingReview ? 'Submitting...' : 'Submit Review'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
