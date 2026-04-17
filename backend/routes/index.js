const createAuthRouter = require('./auth');
const createBooksRouter = require('./books');
const createFavoritesRouter = require('./favorites');
const createReviewsRouter = require('./reviews');

function createApiRouter(deps) {
  const express = require('express');
  const router = express.Router();

  router.use('/', createAuthRouter(deps));
  router.use('/books', createBooksRouter(deps));
  router.use('/favorites', createFavoritesRouter(deps));
  // generated-by-copilot: mount reviews router at /books/:id so it handles
  // /books/:id/reviews and /books/:id/average-rating
  router.use('/books/:id', createReviewsRouter(deps));

  return router;
}

module.exports = createApiRouter;
