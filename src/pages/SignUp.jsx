import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LaunchRegularUserForm from '@/components/signup/LaunchRegularUserForm';

export default function SignUp() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 px-4 py-12">
      <LaunchRegularUserForm onBack={() => navigate(createPageUrl('Home'))} />
    </div>
  );
}
