import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import RegularUserForm from "@/components/signup/RegularUserForm";

export default function SignUp() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(createPageUrl("Home"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-4">
      <RegularUserForm onBack={handleBack} />
    </div>
  );
}
