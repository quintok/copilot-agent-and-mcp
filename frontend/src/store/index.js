import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import booksReducer from './booksSlice';
import favoritesReducer from './favoritesSlice';
import reviewsReducer from './reviewsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    books: booksReducer,
    favorites: favoritesReducer,
    reviews: reviewsReducer,
  },
});
