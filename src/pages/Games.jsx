import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WhatShouldTheyDoGameUpNext from "../features/whatShouldTheyDo/WhatShouldTheyDoGameUpNext";

export default function Games() {
  const navigate = useNavigate();

  return (
    <WhatShouldTheyDoGameUpNext
      onExit={() => navigate(createPageUrl("Home"))}
    />
  );
}
