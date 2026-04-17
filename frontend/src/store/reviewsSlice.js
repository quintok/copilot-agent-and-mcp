import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// generated-by-copilot: thunks for book reviews (list, average rating, submit)
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (bookId) => {
    const res = await fetch(`http://localhost:4000/api/books/${encodeURIComponent(bookId)}/reviews`);
    if (!res.ok) throw new Error(`Failed to load reviews (${res.status})`);
    const data = await res.json();
    return { bookId: String(bookId), reviews: data };
  }
);

export const fetchAverageRating = createAsyncThunk(
  'reviews/fetchAverageRating',
  async (bookId) => {
    const res = await fetch(`http://localhost:4000/api/books/${encodeURIComponent(bookId)}/average-rating`);
    if (!res.ok) throw new Error(`Failed to load average rating (${res.status})`);
    const data = await res.json();
    return { bookId: String(bookId), average: data.average, count: data.count };
  }
);

export const addReview = createAsyncThunk(
  'reviews/addReview',
  async ({ token, bookId, rating, text }, { rejectWithValue }) => {
    const res = await fetch(`http://localhost:4000/api/books/${encodeURIComponent(bookId)}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, text }),
    });
    if (!res.ok) {
      let message = `Failed to submit review (${res.status})`;
      try {
        const body = await res.json();
        if (body && body.message) message = body.message;
      } catch { /* ignore parse errors */ }
      return rejectWithValue({ status: res.status, message });
    }
    const review = await res.json();
    return { bookId: String(bookId), review };
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  // byBook: { [bookId]: { items, status, error, average, count, submitStatus, submitError } }
  initialState: { byBook: {} },
  reducers: {
    clearSubmitState(state, action) {
      const bookId = String(action.payload);
      if (state.byBook[bookId]) {
        state.byBook[bookId].submitStatus = 'idle';
        state.byBook[bookId].submitError = null;
      }
    },
  },
  extraReducers: builder => {
    const ensure = (state, bookId) => {
      const key = String(bookId);
      if (!state.byBook[key]) {
        state.byBook[key] = {
          items: [], status: 'idle', error: null,
          average: 0, count: 0,
          submitStatus: 'idle', submitError: null,
        };
      }
      return state.byBook[key];
    };
    builder
      .addCase(fetchReviews.pending, (state, action) => {
        const entry = ensure(state, action.meta.arg);
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        const entry = ensure(state, action.payload.bookId);
        entry.status = 'succeeded';
        entry.items = action.payload.reviews;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        const entry = ensure(state, action.meta.arg);
        entry.status = 'failed';
        entry.error = action.error?.message || 'Failed to load reviews';
      })
      .addCase(fetchAverageRating.fulfilled, (state, action) => {
        const entry = ensure(state, action.payload.bookId);
        entry.average = action.payload.average;
        entry.count = action.payload.count;
      })
      .addCase(addReview.pending, (state, action) => {
        const entry = ensure(state, action.meta.arg.bookId);
        entry.submitStatus = 'loading';
        entry.submitError = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        const entry = ensure(state, action.payload.bookId);
        entry.submitStatus = 'succeeded';
        entry.submitError = null;
        entry.items = [action.payload.review, ...entry.items];
        entry.count = entry.count + 1;
        entry.average = entry.count === 0
          ? 0
          : ((entry.average * (entry.count - 1)) + action.payload.review.rating) / entry.count;
      })
      .addCase(addReview.rejected, (state, action) => {
        const entry = ensure(state, action.meta.arg.bookId);
        entry.submitStatus = 'failed';
        entry.submitError = (action.payload && action.payload.message)
          || action.error?.message
          || 'Failed to submit review';
      });
  },
});

export const { clearSubmitState } = reviewsSlice.actions;
export default reviewsSlice.reducer;
