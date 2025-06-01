"use client";

import React from "react";
import TranslationDebugger from "./TranslationDebugger";

/**
 * Development tools component that includes all debuggers
 * This component only renders in development mode
 */
export default function DevTools() {
  // Ensure this only runs in the browser and only in development
  if (
    typeof window === "undefined" ||
    process.env.NODE_ENV !== "development"
  ) {
    return null;
  }

  return (
    <>
      <TranslationDebugger />
    </>
  );
}
