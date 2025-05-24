"use client";

import { useEffect, useState } from "react";
import { compareRTLandLTR, getRTLStyleRules, isRTLStylesheetLoaded, setDocumentDirection } from "@/utils/rtl-test-utils";
import type { DirectionType, ComparisonResult, RTLVisualTestProps } from "@/types/testing";

export default function RTLVisualTest({ className = '', testName = 'Main UI Components Test' }: RTLVisualTestProps) {
  const [direction, setDirection] = useState<DirectionType>('ltr');
  const [rtlStylesLoaded, setRtlStylesLoaded] = useState(false);
  const [rtlRules, setRtlRules] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    const dir = document.documentElement.dir;
    setDirection(dir as DirectionType);
    
    setRtlStylesLoaded(isRTLStylesheetLoaded());
    setRtlRules(getRTLStyleRules());
    
    const observer = new MutationObserver(() => {
      setRtlStylesLoaded(isRTLStylesheetLoaded());
      setRtlRules(getRTLStyleRules());
    });
    
    observer.observe(document.head, {
      childList: true,
      subtree: true
    });
    
    return () => observer.disconnect();
  }, []);

  const toggleDirection = () => {
    const newDir = direction === 'rtl' ? 'ltr' : 'rtl';
    setDocumentDirection(newDir);
    setDirection(newDir);
    setComparisonResult(null);
  };
  
  const runVisualComparison = () => {
    const result = compareRTLandLTR(testName, direction);
    setComparisonResult({
      message: result.message,
      timestamp: new Date().toLocaleTimeString()
    });
  };
  
  return (
    <div className={`space-y-12 ${className}`}>
      <div className="bg-gray-100 p-4 rounded-lg mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Visual Testing Control Panel</h2>
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button 
              onClick={toggleDirection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Toggle {direction === 'rtl' ? 'LTR' : 'RTL'}
            </button>
            <button 
              onClick={runVisualComparison}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Capture Current View
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Current Direction: <span className="font-bold">{direction.toUpperCase()}</span></p>
            <p>RTL Stylesheet Loaded: <span className={rtlStylesLoaded ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
              {rtlStylesLoaded ? "Yes" : "No"}
            </span></p>
          </div>
          <div>
            <p className="font-medium">RTL Style Rules: <span className="font-bold">{rtlRules.length}</span></p>
            {comparisonResult && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700">{comparisonResult.message}</p>
                <p className="text-xs text-gray-500">at {comparisonResult.timestamp}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-12">
        <section id="text-alignment-test" className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">1. Text Alignment Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow rtl:text-right">
              <h3 className="font-medium mb-2 rtl:text-right">Paragraph with RTL Control</h3>
              <p>This text should be right-aligned in RTL mode and left-aligned in LTR mode.</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Regular Paragraph</h3>
              <p>This text should follow the document&apos;s direction. In RTL, all text should be right-aligned by default.</p>
            </div>
          </div>
        </section>
        
        {/* ... rest of your test cases remain unchanged ... */}

      </div>
    </div>
  );
}
