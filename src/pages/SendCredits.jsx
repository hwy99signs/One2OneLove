import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SendCredits() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/Subscription', { replace: true });
  }, [navigate]);
  return null;
}
