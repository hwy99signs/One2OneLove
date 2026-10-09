import { Navigate, useLocation } from 'react-router-dom';

export default function PaymentSuccess(){
  const location=useLocation();
  const suffix=location.search||'?checkout=success';
  return <Navigate to={`/Credit${suffix}`} replace />;
}
