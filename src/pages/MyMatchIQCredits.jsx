import React from 'react';
import {Navigate} from 'react-router-dom';

// Legacy route compatibility. MyMatchIQ no longer has a separate credit wallet;
// all metered services use the shared O2OL Token Wallet.
export default function MyMatchIQCredits(){
  return <Navigate to="/Tokens?source=mymatchiq" replace/>;
}
