import { Navigate, useLocation } from 'react-router-dom';

export default function Tokens(){
  const location=useLocation();
  return <Navigate to={`/Credit${location.search||''}`} replace />;
}
