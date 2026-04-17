const express = require('express');

function createBooksRouter({ booksFile, readJSON, writeJSON, authenticateToken }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const books = readJSON(booksFile);
    const sortBy = req.query.sortBy;

    if (!['title', 'author', undefined].includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sortBy parameter. Use "title" or "author".' });
    }

    const sortedBooks = sortBy
      ? [...books].sort((a, b) =>
        String(a[sortBy]).localeCompare(String(b[sortBy]), undefined, { sensitivity: 'base' }),
      )
      : books;
    res.json(sortedBooks);
  });

  // POST /books removed: adding books is not allowed

  return router;
}

module.exports = createBooksRouter;
