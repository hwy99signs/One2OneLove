import React from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import ContributorProfessionalApplication from "@/components/signup/ContributorProfessionalApplication";

export default function InfluencerSignup() {
  const [searchParams] = useSearchParams();
  const plan = String(searchParams.get("plan") || "").toLowerCase();
  if (!["premiere", "premier", "exclusive"].includes(plan)) return <Navigate to="/Subscription?signup=1" replace />;
  return <ContributorProfessionalApplication />;
}
