import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatShouldTheyDoGame from "../features/whatShouldTheyDo/WhatShouldTheyDoGame";

export default function Games() {
  const navigate = useNavigate();

  return (
    <WhatShouldTheyDoGame
      onExit={() => navigate(createPageUrl("Home"))}
    />
  );
}
