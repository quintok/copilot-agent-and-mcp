const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const createApiRouter = require('../routes');
const createReviewsRouter = require('../routes/reviews');

const usersFile = path.join(__dirname, '../data/test-users.json');
const booksFile = path.join(__dirname, '../data/test-books.json');
const reviewsFile = path.join(__dirname, '../data/test-reviews.json');
const SECRET_KEY = 'test_secret';

function getToken(username = 'sandra') {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', createApiRouter({
    usersFile,
    booksFile,
    reviewsFile,
    readJSON: (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : [],
    writeJSON: (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2)),
    authenticateToken: (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.sendStatus(401);
      try {
        req.user = jwt.verify(token, SECRET_KEY);
        next();
      } catch {
        return res.sendStatus(403);
      }
    },
    SECRET_KEY,
  }));
  return app;
}

describe('Reviews API', () => {
  let app;

  beforeEach(() => {
    // Reset review data and rate-limit state between tests
    fs.writeFileSync(reviewsFile, '[]');
    createReviewsRouter._resetRateLimit();
    app = buildApp();
  });

  describe('GET /api/books/:id/reviews', () => {
    it('returns an empty array when a book has no reviews', async () => {
      const res = await request(app).get('/api/books/1/reviews');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 404 for a non-existent book', async () => {
      const res = await request(app).get('/api/books/does-not-exist/reviews');
      expect(res.statusCode).toBe(404);
    });

    it('returns reviews sorted newest-first for a given book', async () => {
      fs.writeFileSync(reviewsFile, JSON.stringify([
        { id: 'a', bookId: '1', username: 'sandra', rating: 3, text: 'older', createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'b', bookId: '1', username: 'sandra', rating: 5, text: 'newer', createdAt: '2025-06-01T00:00:00.000Z' },
        { id: 'c', bookId: '2', username: 'sandra', rating: 1, text: 'other book', createdAt: '2025-03-01T00:00:00.000Z' },
      ]));
      const res = await request(app).get('/api/books/1/reviews');
      expect(res.statusCode).toBe(200);
      expect(res.body.map(r => r.id)).toEqual(['b', 'a']);
    });
  });

  describe('GET /api/books/:id/average-rating', () => {
    it('returns zero average and count for a book with no reviews', async () => {
      const res = await request(app).get('/api/books/1/average-rating');
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ bookId: '1', average: 0, count: 0 });
    });

    it('returns 404 for a non-existent book', async () => {
      const res = await request(app).get('/api/books/missing/average-rating');
      expect(res.statusCode).toBe(404);
    });

    it('computes the average across only the book\'s reviews', async () => {
      fs.writeFileSync(reviewsFile, JSON.stringify([
        { id: 'a', bookId: '1', username: 'sandra', rating: 2, text: 't', createdAt: '2025-01-01T00:00:00.000Z' },
        { id: 'b', bookId: '1', username: 'sandra', rating: 4, text: 't', createdAt: '2025-01-02T00:00:00.000Z' },
        { id: 'c', bookId: '2', username: 'sandra', rating: 1, text: 't', createdAt: '2025-01-03T00:00:00.000Z' },
      ]));
      const res = await request(app).get('/api/books/1/average-rating');
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ bookId: '1', average: 3, count: 2 });
    });
  });

  describe('POST /api/books/:id/reviews', () => {
    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/books/1/reviews')
        .send({ rating: 5, text: 'Great book' });
      expect(res.statusCode).toBe(401);
    });

    it('returns 404 for a non-existent book', async () => {
      const res = await request(app)
        .post('/api/books/does-not-exist/reviews')
        .set('Authorization', `Bearer ${getToken()}`)
        .send({ rating: 5, text: 'Great book' });
      expect(res.statusCode).toBe(404);
    });

    it('rejects missing or out-of-range ratings', async () => {
      for (const bad of [undefined, 0, 6, 3.5, '5']) {
        const res = await request(app)
          .post('/api/books/1/reviews')
          .set('Authorization', `Bearer ${getToken()}`)
          .send({ rating: bad, text: 'Some review' });
        expect(res.statusCode).toBe(400);
      }
    });

    it('rejects missing or empty review text', async () => {
      for (const bad of [undefined, '', '   ']) {
        const res = await request(app)
          .post('/api/books/1/reviews')
          .set('Authorization', `Bearer ${getToken()}`)
          .send({ rating: 4, text: bad });
        expect(res.statusCode).toBe(400);
      }
    });

    it('rejects review text longer than 2000 characters', async () => {
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', `Bearer ${getToken()}`)
        .send({ rating: 4, text: 'a'.repeat(2001) });
      expect(res.statusCode).toBe(400);
    });

    it('creates a review and makes it retrievable', async () => {
      const res = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', `Bearer ${getToken('sandra')}`)
        .send({ rating: 5, text: '  Fantastic read  ' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        bookId: '1',
        username: 'sandra',
        rating: 5,
        text: 'Fantastic read',
      });
      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.createdAt).toBe('string');

      const list = await request(app).get('/api/books/1/reviews');
      expect(list.body.length).toBe(1);
      expect(list.body[0].text).toBe('Fantastic read');

      const avg = await request(app).get('/api/books/1/average-rating');
      expect(avg.body).toMatchObject({ average: 5, count: 1 });
    });

    it('rate-limits rapid submissions from the same user', async () => {
      const token = getToken('sandra');
      const first = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5, text: 'First' });
      expect(first.statusCode).toBe(201);

      const second = await request(app)
        .post('/api/books/1/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 4, text: 'Second' });
      expect(second.statusCode).toBe(429);
      expect(second.headers['retry-after']).toBeDefined();
    });
  });
});
