import React, { useEffect, useRef } from "react";

export default function DismissibleDetailsBoundary({ children, hoverCloseDelay = 1400 }) {
  const rootRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const detailsElements = Array.from(root.querySelectorAll("details"));

    const closeAll = (except = null) => {
      detailsElements.forEach((details) => {
        if (details !== except && details.open) details.open = false;
      });
    };

    const handleDocumentPointerDown = (event) => {
      const active = detailsElements.find((details) => details.open);
      if (active && !active.contains(event.target)) closeAll();
    };

    const enterHandlers = new Map();
    const leaveHandlers = new Map();

    detailsElements.forEach((details) => {
      const handleEnter = () => {
        if (closeTimerRef.current) {
          window.clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
      };

      const handleLeave = () => {
        if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(() => {
          details.open = false;
          closeTimerRef.current = null;
        }, hoverCloseDelay);
      };

      enterHandlers.set(details, handleEnter);
      leaveHandlers.set(details, handleLeave);
      details.addEventListener("mouseenter", handleEnter);
      details.addEventListener("mouseleave", handleLeave);
    });

    document.addEventListener("pointerdown", handleDocumentPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      detailsElements.forEach((details) => {
        details.removeEventListener("mouseenter", enterHandlers.get(details));
        details.removeEventListener("mouseleave", leaveHandlers.get(details));
      });
    };
  }, [hoverCloseDelay]);

  return <div ref={rootRef}>{children}</div>;
}
