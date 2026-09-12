import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LaunchAccountForm from "@/components/signup/LaunchAccountForm";

export default function SignUp() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-4">
      <LaunchAccountForm onBack={handleBack} />
    </div>
  );
}
