import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { 
  ArrowLeft, PlusCircle, LayoutGrid, CalendarRange, CheckCircle2, Clock, 
  XCircle, Film, Monitor, Building, Layers, MapPin 
} from 'lucide-react';

const OrganizerDashboard = ({ setView }) => {
  const { authFetch } = useAuth();
  
  // Tab control: 'dashboard' | 'cinema' | 'screen' | 'movie' | 'show'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [submissions, setSubmissions] = useState({ movies: [], shows: [], cinemas: [], screens: [] });
  const [locations, setLocations] = useState([]);
  const [schedulingScreens, setSchedulingScreens] = useState([]); // screens eligible for scheduling
  const [approvedMovies, setApprovedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Submit Cinema form states
  const [cinemaName, setCinemaName] = useState('');
  const [cinemaAddress, setCinemaAddress] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Submit Screen form states
  const [screenCinema, setScreenCinema] = useState('');
  const [screenName, setScreenName] = useState('');
  const [screenRows, setScreenRows] = useState('10');
  const [screenCols, setScreenCols] = useState('15');

  // Submit Movie form states
  const [movieTitle, setMovieTitle] = useState('');
  const [movieDesc, setMovieDesc] = useState('');
  const [movieDuration, setMovieDuration] = useState('');
  const [movieLang, setMovieLang] = useState('');
  const [movieGenre, setMovieGenre] = useState('');
  const [movieReleaseDate, setMovieReleaseDate] = useState('');
  
  // Submit Show form states
  const [selectedMovie, setSelectedMovie] = useState('');
  const [selectedScreen, setSelectedScreen] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showStartTime, setShowStartTime] = useState('');
  const [showEndTime, setShowEndTime] = useState('');
  const [priceStd, setPriceStd] = useState('150.00');
  const [pricePrem, setPricePrem] = useState('250.00');
  const [priceVip, setPriceVip] = useState('400.00');
  
  const [msg, setMsg] = useState({ text: '', type: '' }); // type: 'success' | 'error'
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/organizer/dashboard/`);
      const data = await res.json();
      setSubmissions(data);

      const screensRes = await authFetch(`${API_BASE_URL}/api/organizer/screens/approved/`);
      const screensData = await screensRes.json();
      setSchedulingScreens(screensData);

      const approvedMoviesRes = await authFetch(`${API_BASE_URL}/api/organizer/approved-movies/`);
      const approvedMoviesData = await approvedMoviesRes.json();
      setApprovedMovies(approvedMoviesData);

      const locationsRes = await fetch(`${API_BASE_URL}/api/locations/`);
      const locationsData = await locationsRes.json();
      setLocations(locationsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    
    // Auto-refresh in the background every 5 seconds to get approval updates instantly
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCinemaSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await authFetch(`${API_BASE_URL}/api/organizer/cinemas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cinemaName,
          address: cinemaAddress,
          location: parseInt(selectedLocation)
        })
      });

      if (!res.ok) throw new Error("Failed to add cinema.");

      setMsg({ text: "Cinema theatre added successfully! Awaiting administrator approval.", type: 'success' });
      setCinemaName('');
      setCinemaAddress('');
      setSelectedLocation('');
      
      await fetchDashboardData();
      setActiveTab('dashboard');
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreenSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await authFetch(`${API_BASE_URL}/api/organizer/screens/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cinema: parseInt(screenCinema),
          name: screenName,
          rows: parseInt(screenRows),
          columns: parseInt(screenCols)
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || errData.non_field_errors || "Failed to add screen.");
      }

      setMsg({ text: "Screen layout added successfully!", type: 'success' });
      setScreenCinema('');
      setScreenName('');
      setScreenRows('10');
      setScreenCols('15');

      await fetchDashboardData();
      setActiveTab('dashboard');
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await authFetch(`${API_BASE_URL}/api/organizer/movies/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: movieTitle,
          description: movieDesc,
          duration_minutes: parseInt(movieDuration),
          language: movieLang,
          genre: movieGenre,
          release_date: movieReleaseDate
        })
      });

      if (!res.ok) throw new Error("Failed to upload movie.");

      setMsg({ text: "Movie details uploaded successfully! Awaiting administrator approval.", type: 'success' });
      setMovieTitle('');
      setMovieDesc('');
      setMovieDuration('');
      setMovieLang('');
      setMovieGenre('');
      setMovieReleaseDate('');
      
      await fetchDashboardData();
      setActiveTab('dashboard');
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await authFetch(`${API_BASE_URL}/api/organizer/shows/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movie: parseInt(selectedMovie),
          screen: parseInt(selectedScreen),
          date: showDate,
          start_time: showStartTime,
          end_time: showEndTime,
          price_standard: parseFloat(priceStd),
          price_premium: parseFloat(pricePrem),
          price_vip: parseFloat(priceVip)
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.detail || "Failed to schedule screening show.");
      }

      setMsg({ text: "Showtime screening scheduled successfully! Awaiting administrator approval.", type: 'success' });
      setSelectedMovie('');
      setSelectedScreen('');
      setShowDate('');
      setShowStartTime('');
      setShowEndTime('');
      
      await fetchDashboardData();
      setActiveTab('dashboard');
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
            <Clock size={12} /> Pending Approval
          </span>
        );
    }
  };

  // Helper to get screen status badge based on its parent cinema approval status
  const getScreenStatusBadge = (screen) => {
    const parentCinema = submissions.cinemas?.find(c => c.id === screen.cinema);
    if (!parentCinema) return getStatusBadge('APPROVED'); // default fallback
    return getStatusBadge(parentCinema.approval_status);
  };

  // Only allow adding screens to approved cinemas
  const approvedCinemas = submissions.cinemas ? submissions.cinemas.filter(c => c.approval_status === 'APPROVED') : [];

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      {/* Back link */}
      <button 
        onClick={() => setView('home')} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--text-muted)',
          marginBottom: '2rem',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          fontWeight: 500
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Customer Booking View</span>
      </button>

      {/* Main title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2.25rem', marginBottom: '0.5rem' }}>
          Screening Organizer Dashboard
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your theatres, screen layouts, uploaded movies, and scheduled showtimes.
        </p>
      </div>

      {/* Tab Controls */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1rem',
        marginBottom: '2.5rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {[
          { id: 'dashboard', label: 'Overview Submissions', icon: <LayoutGrid size={16} /> },
          { id: 'cinema', label: 'Add Cinema Theatre', icon: <Building size={16} /> },
          { id: 'screen', label: 'Add Screen Layout', icon: <Layers size={16} /> },
          { id: 'movie', label: 'Add/Upload Movie', icon: <PlusCircle size={16} /> },
          { id: 'show', label: 'Schedule Screening Show', icon: <CalendarRange size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMsg({ text: '', type: '' });
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(255, 8, 68, 0.12)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              transition: 'var(--transition)',
              fontSize: '0.9rem'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Global Alerts message */}
      {msg.text && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: msg.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1rem',
          color: msg.type === 'success' ? '#34d399' : '#f87171',
          marginBottom: '2rem'
        }}>
          {msg.text}
        </div>
      )}

      {/* Render active tabs */}
      {loading ? (
        <div style={{ height: '250px' }} className="skeleton" />
      ) : activeTab === 'dashboard' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          
          {/* Submissions Section 1: Cinemas */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={22} className="text-primary" /> Submitted Cinemas & Theatres
            </h2>
            {!submissions.cinemas || submissions.cinemas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't submitted any cinemas yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {submissions.cinemas.map(c => (
                  <div key={c.id} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifycontent: 'space-between', gap: '1rem' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                        {c.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                        <span>{c.address} ({c.location_name})</span>
                      </div>
                    </div>
                    {getStatusBadge(c.approval_status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions Section 2: Screens */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} className="text-primary" /> Added Screens
            </h2>
            {!submissions.screens || submissions.screens.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't added any screens yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {submissions.screens.map(s => (
                  <div key={s.id} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifycontent: 'space-between', gap: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                        {s.name}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div style={{ marginBottom: '0.25rem' }}>Theatre: <strong>{s.cinema_name}</strong></div>
                        <div>Layout: <strong>{s.rows} Rows x {s.columns} Columns</strong> ({s.rows * s.columns} Seats)</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Theatre Status:</div>
                      {getScreenStatusBadge(s)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Submissions Section 3: Movies */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Film size={22} className="text-primary" /> Uploaded Movies
            </h2>
            {submissions.movies.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't uploaded any movies yet.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {submissions.movies.map(m => (
                  <div key={m.id} className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifycontent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '0.5rem' }}>
                        <Film size={14} />
                        <span>{m.genre}</span>
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                        {m.title}
                      </h3>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {m.description}
                      </p>
                    </div>
                    {getStatusBadge(m.approval_status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions Section 4: Showtimes */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Monitor size={22} className="text-primary" /> Scheduled Showtimes Screenings
            </h2>
            {submissions.shows.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>You haven't scheduled any screenings yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submissions.shows.map(s => (
                  <div key={s.id} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifycontent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '50px', background: 'var(--accent-gradient)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifycontent: 'center', flexShrink: 0 }}>
                        <Monitor size={20} color="#fff" style={{ margin: 'auto' }} />
                      </div>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.1rem' }}>
                           {s.movie_title}
                        </h4>
                        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          <span>{s.cinema_name} ({s.screen_name})</span>
                          <span>•</span>
                          <span>{s.date} at {s.start_time} - {s.end_time}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(s.approval_status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'cinema' ? (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Add a Cinema or Multiplex Theatre
          </h2>
          <form onSubmit={handleCinemaSubmit} className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cinema Name</label>
              <input type="text" required placeholder="e.g. INOX: Mall Center, Koramangala" value={cinemaName} onChange={(e) => setCinemaName(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Location City</label>
              <select required value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
                <option value="">Select City Location</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Theatre Full Address</label>
              <textarea rows="3" required placeholder="e.g. 3rd Floor, Commercial Center, Koramangala, Bangalore" value={cinemaAddress} onChange={(e) => setCinemaAddress(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none', resize: 'none' }} />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
              {submitting ? 'Adding cinema...' : 'Add Cinema for Approval'}
            </button>
          </form>
        </div>
      ) : activeTab === 'screen' ? (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Add Screen Layout
          </h2>
          {approvedCinemas.length === 0 ? (
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <Building size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>No Approved Cinema Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                You must have an <strong>Approved Cinema</strong> to add screen layouts. Please add a Cinema and await Admin approval.
              </p>
            </div>
          ) : (
            <form onSubmit={handleScreenSubmit} className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select Approved Cinema</label>
                <select required value={screenCinema} onChange={(e) => setScreenCinema(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Select approved Cinema</option>
                  {approvedCinemas.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.location_name})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Screen Name</label>
                <input type="text" required placeholder="e.g. Audi 1, Screen 2, IMAX" value={screenName} onChange={(e) => setScreenName(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rows (Seat layout)</label>
                  <input type="number" required min="1" max="26" value={screenRows} onChange={(e) => setScreenRows(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maximum 26 rows (A-Z representation)</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Columns (Seats per row)</label>
                  <input type="number" required min="1" max="30" value={screenCols} onChange={(e) => setScreenCols(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maximum 30 seats per row</span>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                {submitting ? 'Adding screen...' : 'Add Screen Layout'}
              </button>
            </form>
          )}
        </div>
      ) : activeTab === 'movie' ? (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Add/Upload a New Movie
          </h2>
          <form onSubmit={handleMovieSubmit} className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Movie Title</label>
              <input type="text" required placeholder="e.g. Inception" value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Language</label>
                <input type="text" required placeholder="e.g. English" value={movieLang} onChange={(e) => setMovieLang(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Genre</label>
                <input type="text" required placeholder="e.g. Sci-Fi, Thriller" value={movieGenre} onChange={(e) => setMovieGenre(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duration (mins)</label>
                <input type="number" required placeholder="e.g. 148" value={movieDuration} onChange={(e) => setMovieDuration(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Release Date</label>
                <input type="date" required value={movieReleaseDate} onChange={(e) => setMovieReleaseDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.70rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Synopsis Description</label>
              <textarea rows="4" required placeholder="A thief who steals corporate secrets..." value={movieDesc} onChange={(e) => setMovieDesc(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none', resize: 'none' }} />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
              {submitting ? 'Uploading movie...' : 'Upload Movie for Approval'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Schedule a Show Screening
          </h2>
          {approvedMovies.length === 0 || schedulingScreens.length === 0 ? (
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <Monitor size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Prerequisites Missing</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                You must have at least one <strong>Approved Movie</strong> and one <strong>Approved Screen Layout</strong> to schedule showtimes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleShowSubmit} className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Movie</label>
                <select required value={selectedMovie} onChange={(e) => setSelectedMovie(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Select an Approved Movie</option>
                  {approvedMovies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.language})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Theatre Screen</label>
                <select required value={selectedScreen} onChange={(e) => setSelectedScreen(e.target.value)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
                  <option value="">Select Screen</option>
                  {schedulingScreens.map(s => (
                    <option key={s.id} value={s.id}>{s.cinema_name} - {s.name} ({s.rows}x{s.columns} layout)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date</label>
                  <input type="date" required value={showDate} onChange={(e) => setShowDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.70rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Start Time</label>
                  <input type="time" required value={showStartTime} onChange={(e) => setShowStartTime(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.70rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>End Time</label>
                  <input type="time" required value={showEndTime} onChange={(e) => setShowEndTime(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.70rem', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Price Std (Rs.)</label>
                  <input type="number" required step="0.01" value={priceStd} onChange={(e) => setPriceStd(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Price Prem (Rs.)</label>
                  <input type="number" required step="0.01" value={pricePrem} onChange={(e) => setPricePrem(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Price VIP (Rs.)</label>
                  <input type="number" required step="0.01" value={priceVip} onChange={(e) => setPriceVip(e.target.value)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: 'var(--text-main)', outline: 'none' }} />
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                {submitting ? 'Scheduling...' : 'Schedule Screening Showtime'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
