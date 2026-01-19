import Skeleton from "@/components/ui/Skeleton";

export default function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search Bar Skeleton */}
        <div className="w-full h-14 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center px-4 gap-4">
          <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 flex-1 rounded" />
          <div className="h-8 border-l border-gray-200 dark:border-gray-700" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex gap-2 overflow-hidden py-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Sort & View Mode Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-40 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg py-1" />
          </div>
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>

        {/* Results Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-32 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <Skeleton className="h-8 w-full rounded-lg mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
