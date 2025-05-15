import RTLTestComponent from "@/components/testing/RTLTestComponent";

export const metadata = {
  title: "RTL Testing Page",
  description: "A page to test RTL style loading and appearance",
};

export default function RTLTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">RTL Conditional Loading Test</h1>
      <p className="mb-4">
        This page demonstrates the conditional loading of RTL stylesheets.
        The RTL styles should only be loaded when the page direction is set to RTL.
      </p>
      
      <div className="border-l-4 rtl:border-r-4 rtl:border-l-0 border-blue-500 pl-4 rtl:pr-4 rtl:pl-0 bg-blue-50 p-4 mb-6">
        <p>
          Switch between languages using the language selector in the header to 
          see how RTL styles are conditionally loaded only when Arabic is selected.
        </p>
      </div>
      
      <RTLTestComponent />
      
      <h2 className="text-xl font-bold mt-8 mb-4">RTL Features Testing</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Text Alignment</h3>
          <p className="rtl:text-right">
            This text should be left-aligned in LTR and right-aligned in RTL.
          </p>
        </div>
        
        <div className="border rounded p-4">
          <h3 className="font-medium mb-2">Flex Direction</h3>
          <div className="flex rtl:flex-row-reverse items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
            <div className="w-6 h-6 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
