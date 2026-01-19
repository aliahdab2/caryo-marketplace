import Skeleton from "@/components/ui/Skeleton";

export default function SavedAlertsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-48 rounded" />

      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar Skeleton */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-fit space-y-4">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <Skeleton className="h-7 w-24 rounded" />
            </div>
            <div className="p-3 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 space-y-2 border-b border-gray-100 last:border-0">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-3 w-20 rounded opacity-60" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content Area Skeleton */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-28 rounded-lg" />
                  <Skeleton className="h-10 w-28 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-4 w-64 rounded opacity-70" />
            </div>

            {/* Content List Skeleton */}
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                  <Skeleton className="h-24 w-32 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-48 rounded" />
                      <Skeleton className="h-5 w-20 rounded" />
                    </div>
                    <Skeleton className="h-3 w-full rounded opacity-60" />
                    <Skeleton className="h-3 w-3/4 rounded opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
