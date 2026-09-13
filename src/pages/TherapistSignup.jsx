import React from "react";
import LicensedProfessionalApplication from "@/components/signup/LicensedProfessionalApplication";
import DismissibleDetailsBoundary from "@/components/signup/DismissibleDetailsBoundary";

export default function TherapistSignup() {
  return <DismissibleDetailsBoundary><LicensedProfessionalApplication /></DismissibleDetailsBoundary>;
}
