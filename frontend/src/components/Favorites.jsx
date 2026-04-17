import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, clearAllFavorites } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  // generated-by-copilot: Local state to control the clear-all confirmation dialog and errors
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearError, setClearError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  // generated-by-copilot: Dispatch clear-all and handle success / error states
  const handleConfirmClear = async () => {
    setClearError('');
    const result = await dispatch(clearAllFavorites(token));
    if (clearAllFavorites.rejected.match(result)) {
      setClearError('Failed to clear favorites. Please try again.');
    }
    setShowConfirm(false);
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div>
      <h2>My Favorite Books</h2>
      {favorites.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '2rem auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>No favorite books yet.</p>
          <p>
            Go to the <a href="/books" onClick={e => { e.preventDefault(); navigate('/books'); }}>book list</a> to add some!
          </p>
        </div>
      ) : (
        <>
          <button
            id="clear-all-favorites"
            onClick={() => setShowConfirm(true)}
            style={{
              background: '#d9534f',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            Clear All
          </button>
          <ul>
            {favorites.map(book => (
              <li key={book.id}>
                <strong>{book.title}</strong> by {book.author}
              </li>
            ))}
          </ul>
        </>
      )}
      {clearError && (
        <div role="alert" style={{ color: '#d9534f', marginTop: '1rem' }}>{clearError}</div>
      )}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-all-confirm-title"
          aria-describedby="clear-all-confirm-description"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
            <h3 id="clear-all-confirm-title" style={{ marginTop: 0 }}>Clear all favorites?</h3>
            <p id="clear-all-confirm-description">Are you sure you want to remove all books from your favorites? This cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button id="clear-all-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button
                id="clear-all-confirm"
                onClick={handleConfirmClear}
                style={{ background: '#d9534f', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
