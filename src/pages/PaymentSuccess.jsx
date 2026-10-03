import React from 'react';
import {Navigate} from 'react-router-dom';

// Legacy recurring-subscription return route. New O2OL purchases return directly
// to /Tokens where the one-time checkout is confirmed and credited idempotently.
export default function PaymentSuccess(){
  return <Navigate to="/Tokens" replace/>;
}
