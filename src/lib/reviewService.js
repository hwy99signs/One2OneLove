import { supabase } from './supabase';

function isReviewsSetupMissing(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    message.includes('reviews') && (message.includes('does not exist') || message.includes('schema cache'))
  );
}

export async function getPublishedReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('id,user_id,reviewer_name,city,country,rating,review_text,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    if (isReviewsSetupMissing(error)) return [];
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return data || [];
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

  const { data, error } = await supabase.rpc('submit_platform_review', {
    p_rating: rating,
    p_review_text: cleanReview,
  });

  if (error) {
    const message = String(error.message || '');
    if (message.includes('PROFILE_INCOMPLETE')) {
      throw new Error('Please complete your name, city, and country in your profile before leaving a review.');
    }
    if (message.includes('REVIEW_EXISTS') || error.code === '23505') {
      throw new Error('You have already submitted a review.');
    }
    if (message.includes('AUTH_REQUIRED')) {
      throw new Error('Please sign in before leaving a review.');
    }
    if (isReviewsSetupMissing(error) || message.toLowerCase().includes('submit_platform_review')) {
      throw new Error('Review submissions are not configured yet.');
    }

    console.error('Error submitting review:', error);
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}
