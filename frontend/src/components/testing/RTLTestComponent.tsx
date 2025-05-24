"use client";

import { useEffect, useState } from "react";
import { isRTLStylesheetLoaded } from "@/utils/rtl-test-utils";
import type { RTLTestComponentProps } from "@/types/testing";

export default function RTLTestComponent({ className = '' }: RTLTestComponentProps) {
  const [isRTL, setIsRTL] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [direction, setDirection] = useState("");
  
  useEffect(() => {
    // Get current document direction
    const dir = document.documentElement.dir;
    setIsRTL(dir === "rtl");
    setDirection(dir);
    
    // Check if RTL stylesheet is loaded
    setStyleLoaded(isRTLStylesheetLoaded());
    
    // Set up an observer to detect when stylesheets are loaded
    const observer = new MutationObserver(() => {
      setStyleLoaded(isRTLStylesheetLoaded());
    });
    
    observer.observe(document.head, {
      childList: true,
      subtree: true
    });
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div className={`p-4 border rounded my-4 ${className}`}>
      <h2 className="text-xl font-bold mb-4">RTL Testing Panel</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p>Current direction: <strong>{direction}</strong></p>
          <p>Is RTL: <strong>{isRTL ? "Yes" : "No"}</strong></p>
          <p>RTL Stylesheet loaded: <strong>{styleLoaded ? "Yes" : "No"}</strong></p>
        </div>
        <div>
          <h3 className="font-medium mb-2">Test Elements</h3>
          <div className="flex items-center space-x-3 rtl:space-x-reverse border p-2">
            <button className="bg-blue-500 text-white px-3 py-1 rounded">First</button>
            <button className="bg-green-500 text-white px-3 py-1 rounded">Second</button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            The buttons above should have proper spacing in both LTR and RTL modes
          </p>
        </div>
      </div>
    </div>
  );
}
