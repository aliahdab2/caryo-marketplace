"use client";

import { useEffect, useState } from "react";
import { checkRTLAlignment, compareRTLandLTR, getRTLStyleRules, isRTLStylesheetLoaded, setDocumentDirection } from "@/utils/rtl-test-utils";

export default function RTLVisualTest() {
  const [direction, setDirection] = useState<'rtl' | 'ltr'>('ltr');
  const [rtlStylesLoaded, setRtlStylesLoaded] = useState(false);
  const [rtlRules, setRtlRules] = useState<string[]>([]);
  
  useEffect(() => {
    // Get the current document direction
    const dir = document.documentElement.dir;
    setDirection(dir as 'rtl' | 'ltr');
    
    // Check if RTL stylesheet is loaded
    setRtlStylesLoaded(isRTLStylesheetLoaded());
    
    // Get RTL-specific style rules
    setRtlRules(getRTLStyleRules());
    
    // Set up observer for stylesheet changes
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

  const [comparisonResult, setComparisonResult] = useState<{ message: string; timestamp: string } | null>(null);

  // Function to toggle RTL/LTR
  const toggleDirection = () => {
    const newDir = direction === 'rtl' ? 'ltr' : 'rtl';
    setDocumentDirection(newDir);
    setDirection(newDir);
    setComparisonResult(null); // Clear any previous comparison results
  };
  
  // Function to trigger comparison screenshots
  const runVisualComparison = () => {
    const result = compareRTLandLTR('Main UI Components Test', direction);
    setComparisonResult({
      message: result.message,
      timestamp: new Date().toLocaleTimeString()
    });
  };
  
  return (
    <div className="space-y-12">
      {/* Control Panel */}
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
      
      {/* Test Cases */}
      <div className="space-y-12">
        {/* Test Case 1: Text Alignment */}
        <section id="text-alignment-test" className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">1. Text Alignment Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow rtl:text-right">
              <h3 className="font-medium mb-2 rtl:text-right">Paragraph with RTL Control</h3>
              <p>This text should be right-aligned in RTL mode and left-aligned in LTR mode.</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Regular Paragraph</h3>
              <p>This text should follow the document's direction. In RTL, all text should be right-aligned by default.</p>
            </div>
          </div>
        </section>
        
        {/* Test Case 2: Button Groups & Spacing */}
        <section id="button-group-test" className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">2. Button Groups & Spacing Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Standard Button Group</h3>
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <button className="bg-blue-500 text-white px-4 py-2 rounded">Button 1</button>
                <button className="bg-gray-500 text-white px-4 py-2 rounded">Button 2</button>
                <button className="bg-green-500 text-white px-4 py-2 rounded">Button 3</button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Action Buttons</h3>
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
                <button className="border border-gray-300 px-4 py-2 rounded">Cancel</button>
                <button className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Card Actions</h3>
              <div className="p-4 border rounded">
                <p className="mb-4">Card content goes here</p>
                <div className="flex items-center justify-between">
                  <span>Created: May 15, 2025</span>
                  <div className="flex items-center rtl:gap-3">
                    <button className="text-blue-500 hover:underline">Edit</button>
                    <button className="text-red-500 hover:underline ml-4 rtl:mr-4 rtl:ml-0">Delete</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Icon Buttons</h3>
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <button className="p-2 bg-gray-200 rounded-full">
                  <span className="block w-5 h-5 bg-gray-500 rounded-full"></span>
                </button>
                <button className="p-2 bg-gray-200 rounded-full">
                  <span className="block w-5 h-5 bg-gray-500 rounded-full"></span>
                </button>
                <button className="p-2 bg-gray-200 rounded-full flip-in-rtl">
                  <span className="block w-5 h-5 border-t-2 border-r-2 border-gray-500 rotate-45 translate-x-[-2px]"></span>
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Test Case 3: Forms & Inputs */}
        <section id="form-test" className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">3. Forms & Inputs Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Text Input</h3>
              <label className="block mb-1">Name</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter your name"
              />
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Input with Icon</h3>
              <label className="block mb-1">Search</label>
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded px-3 py-2 pl-10 rtl:pl-3 rtl:pr-10"
                  placeholder="Search..."
                />
                <div className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2">
                  <span className="block w-4 h-4 border-2 border-gray-400 rounded-full"></span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Form Layout</h3>
              <form className="space-y-4">
                <div>
                  <label className="block mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="flex-1">
                    <label className="block mb-1">First Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Checkboxes & Radios</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <input type="checkbox" id="checkbox1" />
                  <label htmlFor="checkbox1">Subscribe to newsletter</label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <input type="checkbox" id="checkbox2" />
                  <label htmlFor="checkbox2">Receive updates</label>
                </div>
                <div className="mt-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input type="radio" name="option" id="radio1" />
                    <label htmlFor="radio1">Option 1</label>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <input type="radio" name="option" id="radio2" />
                    <label htmlFor="radio2">Option 2</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Test Case 4: Tables & Data Display */}
        <section id="tables-test" className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">4. Tables & Data Display Test</h2>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b px-4 py-2 text-left rtl:text-right">#</th>
                  <th className="border-b px-4 py-2 text-left rtl:text-right">Name</th>
                  <th className="border-b px-4 py-2 text-left rtl:text-right">Date</th>
                  <th className="border-b px-4 py-2 text-left rtl:text-right">Status</th>
                  <th className="border-b px-4 py-2 text-left rtl:text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-b px-4 py-2">1</td>
                  <td className="border-b px-4 py-2">Ahmed Mohamed</td>
                  <td className="border-b px-4 py-2">2025-05-10</td>
                  <td className="border-b px-4 py-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                  </td>
                  <td className="border-b px-4 py-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button className="text-blue-500">Edit</button>
                      <button className="text-red-500">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border-b px-4 py-2">2</td>
                  <td className="border-b px-4 py-2">Sarah Johnson</td>
                  <td className="border-b px-4 py-2">2025-05-12</td>
                  <td className="border-b px-4 py-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>
                  </td>
                  <td className="border-b px-4 py-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button className="text-blue-500">Edit</button>
                      <button className="text-red-500">Delete</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">3</td>
                  <td className="px-4 py-2">John Smith</td>
                  <td className="px-4 py-2">2025-05-15</td>
                  <td className="px-4 py-2">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Inactive</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button className="text-blue-500">Edit</button>
                      <button className="text-red-500">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        {/* Test Case 5: Navigation & Breadcrumbs */}
        <section id="navigation-test" className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">5. Navigation & Breadcrumbs Test</h2>
          <div className="space-y-6">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Breadcrumbs</h3>
              <nav className="flex">
                <ol className="flex items-center flex-wrap">
                  <li className="flex items-center">
                    <a href="#" className="text-blue-500 hover:underline">Home</a>
                    <span className="mx-2 rtl:rotate-180">›</span>
                  </li>
                  <li className="flex items-center">
                    <a href="#" className="text-blue-500 hover:underline">Products</a>
                    <span className="mx-2 rtl:rotate-180">›</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-500">Current Page</span>
                  </li>
                </ol>
              </nav>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Tabs</h3>
              <div className="border-b">
                <nav className="flex space-x-8 rtl:space-x-reverse">
                  <a href="#" className="border-b-2 border-blue-500 py-2 px-1 -mb-px">Overview</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 py-2 px-1">Features</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 py-2 px-1">Specifications</a>
                  <a href="#" className="text-gray-500 hover:text-gray-700 py-2 px-1">Reviews</a>
                </nav>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-medium mb-2">Pagination</h3>
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <button className="px-3 py-1 rounded border hover:bg-gray-100 rtl:rotate-180">
                  ←
                </button>
                <button className="px-3 py-1 rounded border hover:bg-gray-100">1</button>
                <button className="px-3 py-1 rounded border bg-blue-500 text-white">2</button>
                <button className="px-3 py-1 rounded border hover:bg-gray-100">3</button>
                <span>...</span>
                <button className="px-3 py-1 rounded border hover:bg-gray-100">10</button>
                <button className="px-3 py-1 rounded border hover:bg-gray-100 rtl:rotate-180">
                  →
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
