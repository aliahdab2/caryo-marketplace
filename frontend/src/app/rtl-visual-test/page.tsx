import RTLVisualTest from "@/components/testing/RTLVisualTest";

export const metadata = {
  title: "RTL Visual Testing",
  description: "Visual testing page for RTL layout verification",
};

export default function RTLVisualTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">RTL Visual Testing</h1>
      <p className="mb-6">
        This page contains various UI components in a testing layout to verify 
        proper RTL styling and behavior for visual regression testing.
      </p>
      
      <RTLVisualTest />
    </div>
  );
}
