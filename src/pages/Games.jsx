import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatShouldTheyDoGameHybrid from "../features/whatShouldTheyDo/WhatShouldTheyDoGameHybrid";

export default function Games() {
  const navigate = useNavigate();

  return (
    <WhatShouldTheyDoGameHybrid
      onExit={() => navigate(createPageUrl("Home"))}
    />
  );
}
