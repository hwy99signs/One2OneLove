import React from 'react';
import {Navigate} from 'react-router-dom';

// Legacy route compatibility. O2OL no longer sells Premiere/Exclusive recurring
// access in Token Prelaunch.
export default function Subscription(){
  return <Navigate to="/Tokens" replace/>;
}
