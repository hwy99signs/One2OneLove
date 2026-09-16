import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatShouldTheyDoGameHybridReadable from "../features/whatShouldTheyDo/WhatShouldTheyDoGameHybridReadable";

export default function Games() {
  const navigate = useNavigate();

  return (
    <WhatShouldTheyDoGameHybridReadable
      onExit={() => navigate(createPageUrl("Home"))}
    />
  );
}
