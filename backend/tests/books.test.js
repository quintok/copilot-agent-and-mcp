const request = require('supertest');
const express = require('express');
const createApiRouter = require('../routes');
const path = require('path');

const app = express();
app.use(express.json());
app.use('/api', createApiRouter({
  usersFile: path.join(__dirname, '../data/test-users.json'),
  booksFile: path.join(__dirname, '../data/test-books.json'),
  readJSON: (file) => require('fs').existsSync(file) ? JSON.parse(require('fs').readFileSync(file, 'utf-8')) : [],
  writeJSON: (file, data) => require('fs').writeFileSync(file, JSON.stringify(data, null, 2)),
  authenticateToken: (req, res, next) => next(), // No auth for books
  SECRET_KEY: 'test_secret',
}));

describe('Books API', () => {
  it('GET /api/books should return a list of books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/books should support sorting by title', async () => {
    const res = await request(app).get('/api/books?sortBy=title');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const titles = res.body.map(book => book.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
  });

  it('GET /api/books should support sorting by author', async () => {
    const res = await request(app).get('/api/books?sortBy=author');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const authors = res.body.map(book => book.author);
    expect(authors).toEqual([...authors].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
  });

  it('GET /api/books should reject invalid sort criteria', async () => {
    const res = await request(app).get('/api/books?sortBy=year');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: 'Invalid sortBy parameter. Use "title" or "author".',
    });
  });

  it('POST /api/books should not be allowed', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Test Book', author: 'Test Author' });
    expect([404, 405]).toContain(res.statusCode);
  });
});
