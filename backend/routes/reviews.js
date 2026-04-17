const express = require('express');

// generated-by-copilot: simple in-memory rate limiter for review submissions
// Limits each authenticated user to one review submission per REVIEW_RATE_LIMIT_MS window.
const REVIEW_RATE_LIMIT_MS = 10 * 1000;
const lastSubmission = new Map();

function createReviewsRouter({ booksFile, reviewsFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router({ mergeParams: true });

  function getBook(bookId) {
    const books = readJSON(booksFile);
    return books.find(b => String(b.id) === String(bookId));
  }

  function getReviewsForBook(bookId) {
    const reviews = readJSON(reviewsFile);
    return reviews.filter(r => String(r.bookId) === String(bookId));
  }

  // GET /api/books/:id/reviews
  router.get('/reviews', (req, res) => {
    const bookId = req.params.id;
    if (!getBook(bookId)) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const bookReviews = getReviewsForBook(bookId)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(bookReviews);
  });

  // GET /api/books/:id/average-rating
  router.get('/average-rating', (req, res) => {
    const bookId = req.params.id;
    if (!getBook(bookId)) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const bookReviews = getReviewsForBook(bookId);
    const count = bookReviews.length;
    const average = count === 0
      ? 0
      : bookReviews.reduce((sum, r) => sum + Number(r.rating), 0) / count;
    res.json({ bookId: String(bookId), average, count });
  });

  // POST /api/books/:id/reviews
  router.post('/reviews', authenticateToken, (req, res) => {
    const bookId = req.params.id;
    if (!getBook(bookId)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { rating, text } = req.body || {};

    // generated-by-copilot: validate rating is an integer between 1 and 5
    if (rating === undefined || rating === null
        || typeof rating !== 'number' || !Number.isInteger(rating)
        || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // generated-by-copilot: validate review text is a non-empty string up to 2000 chars
    if (typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ message: 'Review text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Review text must be 2000 characters or fewer' });
    }

    const username = req.user && req.user.username;
    const now = Date.now();
    const last = lastSubmission.get(username);
    if (last && now - last < REVIEW_RATE_LIMIT_MS) {
      const retryAfter = Math.ceil((REVIEW_RATE_LIMIT_MS - (now - last)) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: 'Too many review submissions. Please try again later.' });
    }

    const reviews = readJSON(reviewsFile);
    const review = {
      id: String(now) + Math.random().toString(36).slice(2, 8),
      bookId: String(bookId),
      username,
      rating,
      text: text.trim(),
      createdAt: new Date(now).toISOString(),
    };
    reviews.push(review);
    writeJSON(reviewsFile, reviews);
    lastSubmission.set(username, now);

    res.status(201).json(review);
  });

  return router;
}

// generated-by-copilot: exposed for tests to reset rate-limit state between cases
createReviewsRouter._resetRateLimit = () => lastSubmission.clear();

module.exports = createReviewsRouter;
