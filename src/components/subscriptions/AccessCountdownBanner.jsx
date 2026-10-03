import React from 'react';

// Recurring-plan and Founding trial countdowns are retired in the Free Account
// + O2OL Token model. Kept as a no-op compatibility component so old imports
// cannot reintroduce a subscription access countdown.
export default function AccessCountdownBanner(){
  return null;
}
