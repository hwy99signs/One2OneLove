import React, { cloneElement, isValidElement, useMemo } from 'react';

// Retired (owner decision, 2026-11-25): all One2OneLove games are
// FREE during our launch period for everyone — no account, no phone verification, no
// Credit, no server "pass". This gate used to open a server game session
// (and bounce unverified members to phone verification). It now renders
// the game directly and hands it a locally generated session reference so
// game components that tag a run with the reference keep working without
// any server call.
export default function PaidGameSessionGate({ children }) {
  const sessionRef = useMemo(
    () => 'free-' + (globalThis.crypto?.randomUUID?.() || String(Date.now())),
    [],
  );
  return isValidElement(children) ? cloneElement(children, { gameSessionRef: sessionRef }) : children;
}
