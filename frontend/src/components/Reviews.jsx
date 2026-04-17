import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchReviews,
  fetchAverageRating,
  addReview,
  clearSubmitState,
} from '../store/reviewsSlice';
import styles from '../styles/Reviews.module.css';

// generated-by-copilot: accessible 1-5 star selector
const StarSelector = ({ value, onChange, disabled }) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div
      className={styles.starInput}
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          disabled={disabled}
          className={styles.starBtn + (n <= active ? ' ' + styles.starBtnActive : '')}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          {n <= active ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
};

// generated-by-copilot: static star display for average rating
const StarDisplay = ({ value }) => {
  const rounded = Math.round(value);
  return (
    <span className={styles.starDisplay} aria-hidden="true">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= rounded ? styles.starFilled : styles.starEmpty}>
          {n <= rounded ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
};

const Reviews = ({ bookId }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.user.token);
  const entry = useAppSelector(state => state.reviews.byBook[String(bookId)]);

  const items = entry?.items || [];
  const status = entry?.status || 'idle';
  const error = entry?.error || null;
  const average = entry?.average || 0;
  const count = entry?.count || 0;
  const submitStatus = entry?.submitStatus || 'idle';
  const submitError = entry?.submitError || null;

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (expanded) {
      dispatch(fetchReviews(bookId));
      dispatch(fetchAverageRating(bookId));
    }
  }, [dispatch, bookId, expanded]);

  // Clear form after a successful submission
  useEffect(() => {
    if (submitStatus === 'succeeded') {
      setRating(0);
      setText('');
      setValidationError(null);
      dispatch(clearSubmitState(bookId));
    }
  }, [submitStatus, dispatch, bookId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setValidationError('You must be logged in to submit a review.');
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setValidationError('Please select a rating from 1 to 5 stars.');
      return;
    }
    if (!text.trim()) {
      setValidationError('Please enter some review text.');
      return;
    }
    if (text.length > 2000) {
      setValidationError('Review text must be 2000 characters or fewer.');
      return;
    }
    setValidationError(null);
    await dispatch(addReview({ token, bookId, rating, text: text.trim() }));
  };

  return (
    <div className={styles.reviewsSection} data-testid={`reviews-${bookId}`}>
      <div className={styles.reviewsHeader}>
        <button
          type="button"
          className={styles.toggleBtn}
          aria-expanded={expanded}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? 'Hide Reviews' : 'Show Reviews'}
        </button>
        <span className={styles.ratingSummary} aria-label={`Average rating ${average.toFixed(1)} out of 5 based on ${count} reviews`}>
          <StarDisplay value={average} />
          <span className={styles.ratingNumber}>
            {count > 0 ? average.toFixed(1) : '—'}
          </span>
          <span className={styles.ratingCount}>
            ({count} review{count === 1 ? '' : 's'})
          </span>
        </span>
      </div>

      {expanded && (
        <div className={styles.reviewsBody}>
          {status === 'loading' && <div className={styles.status}>Loading reviews…</div>}
          {status === 'failed' && (
            <div className={styles.errorText} role="alert">{error || 'Failed to load reviews.'}</div>
          )}
          {status === 'succeeded' && items.length === 0 && (
            <div className={styles.status}>No reviews yet. Be the first!</div>
          )}
          {items.length > 0 && (
            <ul className={styles.reviewList}>
              {items.map(r => (
                <li key={r.id} className={styles.reviewItem}>
                  <div className={styles.reviewMeta}>
                    <StarDisplay value={r.rating} />
                    <span className={styles.reviewUser}>{r.username}</span>
                    <span className={styles.reviewDate}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.reviewText}>{r.text}</div>
                </li>
              ))}
            </ul>
          )}

          {token ? (
            <form className={styles.reviewForm} onSubmit={handleSubmit}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Your rating:</label>
                <StarSelector
                  value={rating}
                  onChange={setRating}
                  disabled={submitStatus === 'loading'}
                />
              </div>
              <textarea
                className={styles.reviewTextarea}
                placeholder="Share your thoughts about this book…"
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={2000}
                rows={3}
                disabled={submitStatus === 'loading'}
                aria-label="Review text"
              />
              {validationError && (
                <div className={styles.errorText} role="alert">{validationError}</div>
              )}
              {submitError && (
                <div className={styles.errorText} role="alert">{submitError}</div>
              )}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitStatus === 'loading'}
              >
                {submitStatus === 'loading' ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <div className={styles.status}>Log in to leave a review.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reviews;
