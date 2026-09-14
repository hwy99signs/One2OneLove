import { apiRequest } from './apiClient';

export async function getPublishedReviews() {
  try {
    const payload = await apiRequest('/api/reviews');
    return payload?.reviews || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

export async function submitReview({ rating, reviewText }) {
  const cleanReview = String(reviewText || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Please select a rating from 1 to 5 stars.');
  }
  if (cleanReview.length < 10) {
    throw new Error('Please write at least 10 characters in your review.');
  }
  if (cleanReview.length > 2000) {
    throw new Error('Please keep your review under 2,000 characters.');
  }

  const payload = await apiRequest('/api/reviews', {
    method: 'POST',
    body: { rating, review_text: cleanReview },
  });
  return payload?.review || null;
}
