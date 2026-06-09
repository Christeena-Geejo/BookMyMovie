import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { MapPin, Film, Star, ArrowRight } from 'lucide-react';

const Home = ({ 
  selectedCity, 
  setSelectedCity, 
  cities, 
  setView, 
  setSelectedMovieId, 
  searchQuery 
}) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  useEffect(() => {
    if (!selectedCity) return;
    
    const fetchMovies = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE_URL}/api/movies/?location=${selectedCity}`;
        const res = await fetch(url);
        const data = await res.json();
        setMovies(data);
      } catch (err) {
        console.error("Error fetching movies:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [selectedCity]);

  // Extract unique genres and languages for filters
  const genres = [...new Set(movies.flatMap(m => m.genre.split(', ').map(g => g.trim())))];
  const languages = [...new Set(movies.map(m => m.language))];

  // Filtering logic
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          movie.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre ? movie.genre.includes(selectedGenre) : true;
    const matchesLanguage = selectedLanguage ? movie.language === selectedLanguage : true;
    return matchesSearch && matchesGenre && matchesLanguage;
  });

  // Movie Card Gradient generator
  const getGradient = (id) => {
    const gradients = [
      'linear-gradient(135deg, #2e0854 0%, #ff0844 100%)',
      'linear-gradient(135deg, #102e54 0%, #089fba 100%)',
      'linear-gradient(135deg, #54082e 0%, #f76b1c 100%)',
      'linear-gradient(135deg, #1d3319 0%, #5ba83b 100%)',
    ];
    return gradients[id % gradients.length];
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Forced Location Selection Modal */}
      {!selectedCity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 5, 8, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass" style={{
            padding: '3rem',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <MapPin size={48} color="var(--primary)" style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px var(--primary))' }} />
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '2rem', marginBottom: '1rem' }}>
              Welcome to BookMyMovie
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Select your city to browse movies, show times, and check seat availability.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1rem'
            }}>
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
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
                  <span>{city}</span>
                  <ArrowRight size={18} color="var(--primary)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedCity && (
        <>
          {/* Hero Banner Section */}
          <div className="glass" style={{
            borderRadius: '16px',
            padding: '3rem 2rem',
            marginBottom: '3rem',
            background: 'linear-gradient(to right, rgba(255, 8, 68, 0.15), rgba(18, 20, 28, 0.9))',
            border: '1px solid rgba(255, 8, 68, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <h1 style={{
              fontFamily: 'var(--font-title)',
              fontWeight: 800,
              fontSize: '2.5rem',
              lineHeight: 1.2,
              marginBottom: '1rem',
              maxWidth: '600px'
            }}>
              Book Tickets For Your Favorite Movies in <span style={{ color: 'var(--primary)' }}>{selectedCity}</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: '500px' }}>
              Experience the best seats, instant booking, and secure ticket locks.
            </p>
          </div>

          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontWeight: 700, fontSize: '1.5rem' }}>
              Now Showing
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Genre Filter */}
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: 'var(--text-main)',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              {/* Language Filter */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  color: 'var(--text-main)',
                  fontWeight: 500,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Languages</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Movie Grid */}
          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '2rem'
            }}>
              {[1, 2, 3, 4].map(n => (
                <div key={n} style={{ height: '350px' }} className="skeleton" />
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <Film size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.125rem' }}>No movies found matching your filters in {selectedCity}.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '2rem'
            }}>
              {filteredMovies.map(movie => (
                <div
                  key={movie.id}
                  onClick={() => {
                    setSelectedMovieId(movie.id);
                    setView('movie-detail');
                  }}
                  className="glass"
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.borderColor = 'rgba(255, 8, 68, 0.4)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 8, 68, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Movie Poster Background Design */}
                  <div style={{
                    height: '280px',
                    background: getGradient(movie.id),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '1.5rem',
                    position: 'relative',
                    textAlign: 'center'
                  }}>
                    <Film size={40} color="rgba(255,255,255,0.7)" style={{ marginBottom: '1rem' }} />
                    <span style={{
                      fontFamily: 'var(--font-title)',
                      fontWeight: 800,
                      fontSize: '1.25rem',
                      color: '#fff',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                      {movie.title}
                    </span>
                    
                    {/* Language Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--primary)'
                    }}>
                      {movie.language}
                    </div>
                  </div>

                  {/* Movie Info */}
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{
                        fontFamily: 'var(--font-title)',
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        marginBottom: '0.25rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {movie.title}
                      </h3>
                      <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.5rem'
                      }}>
                        {movie.genre}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{movie.duration_minutes} mins</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontWeight: 600 }}>
                        <Star size={12} fill="#fbbf24" color="#fbbf24" /> {movie.average_rating > 0 ? `${movie.average_rating} / 5` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
