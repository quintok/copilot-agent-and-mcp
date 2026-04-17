# Backend API Routes

All routes are mounted under `/api`.

## Auth

- `POST /api/register` — body `{ username, password }`. Creates a new user.
- `POST /api/login` — body `{ username, password }`. Returns `{ token }`.

## Books

- `GET /api/books` — returns the list of books.

## Favorites

All favorites endpoints require a `Authorization: Bearer <token>` header.

- `GET /api/favorites` — returns the current user's favorite books.
- `POST /api/favorites` — body `{ bookId }`. Adds a book to the current user's favorites.

## Reviews

- `GET /api/books/:id/reviews` — returns the list of reviews for the book, newest first. Returns 404 if the book does not exist.
- `GET /api/books/:id/average-rating` — returns `{ bookId, average, count }` for the book. Returns 404 if the book does not exist.
- `POST /api/books/:id/reviews` — **requires authentication**. Body:
  ```json
  { "rating": 1-5 (integer), "text": "<review text, 1-2000 chars>" }
  ```
  Validation errors return `400`. Submissions are rate-limited per authenticated user; excessive submissions return `429` with a `Retry-After` header. On success returns `201` and the created review object.
