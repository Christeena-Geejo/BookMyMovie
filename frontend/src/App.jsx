import React, { useState, useEffect } from 'react';
import { AuthProvider, API_BASE_URL } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyBookings from './pages/MyBookings';
import OrganizerDashboard from './pages/OrganizerDashboard';
import TicketVerify from './pages/TicketVerify';


const AppContent = () => {
  const [view, setView] = useState('home');
  const [verifyBookingCode, setVerifyBookingCode] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [previousViewInfo, setPreviousViewInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Path-based ticket scanning router
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/verify-ticket/')) {
      const code = path.split('/verify-ticket/')[1]?.replace(/\//g, '');
      if (code) {
        setVerifyBookingCode(code);
        setView('verify-ticket');
      }
    }
  }, []);

  const [cities, setCities] = useState([]);

  useEffect(() => {
    // Fetch locations from backend
    const fetchLocations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/locations/`);
        const data = await res.json();
        // Convert to array of strings since Home and Header expect strings
        if (Array.isArray(data)) {
          setCities(data.map(loc => loc.name));
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
  }, []);
  const renderView = () => {
    switch (view) {
      case 'home':
        return (
          <Home
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            cities={cities}
            setView={setView}
            setSelectedMovieId={setSelectedMovieId}
            searchQuery={searchQuery}
          />
        );
      case 'movie-detail':
        return (
          <MovieDetail
            selectedMovieId={selectedMovieId}
            selectedCity={selectedCity}
            setView={setView}
            setSelectedShowId={setSelectedShowId}
          />
        );
      case 'seat-selection':
        return (
          <SeatSelection
            selectedShowId={selectedShowId}
            setView={setView}
            setPendingBooking={setPendingBooking}
            setPreviousViewInfo={setPreviousViewInfo}
          />
        );
      case 'checkout':
        return (
          <Checkout
            pendingBooking={pendingBooking}
            setView={setView}
            setConfirmedBooking={setConfirmedBooking}
          />
        );
      case 'booking-confirmed':
        return (
          <Confirmation
            confirmedBooking={confirmedBooking}
            setView={setView}
          />
        );
      case 'login':
        return (
          <Login
            setView={setView}
            previousViewInfo={previousViewInfo}
            setSelectedShowId={setSelectedShowId}
          />
        );
      case 'signup':
        return (
          <Signup
            setView={setView}
            previousViewInfo={previousViewInfo}
            setSelectedShowId={setSelectedShowId}
          />
        );
      case 'my-bookings':
        return (
          <MyBookings
            setView={setView}
          />
        );
      case 'organizer-dashboard':
        return (
          <OrganizerDashboard
            setView={setView}
          />
        );
      case 'verify-ticket':
        return (
          <TicketVerify
            bookingCode={verifyBookingCode}
            onClose={() => {
              window.history.pushState({}, '', '/');
              setView('home');
            }}
          />
        );

      default:
        return (
          <Home 
            selectedCity={selectedCity} 
            setSelectedCity={setSelectedCity} 
            cities={cities} 
            setView={setView} 
            setSelectedMovieId={setSelectedMovieId} 
            searchQuery={searchQuery} 
          />
        );
    }
  };

  return (
    <>
      <Header
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        cities={cities}
        setView={setView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      {renderView()}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
