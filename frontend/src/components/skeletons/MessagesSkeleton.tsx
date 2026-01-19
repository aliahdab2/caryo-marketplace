import Skeleton from "@/components/ui/Skeleton";

export default function MessagesSkeleton() {
  return (
    <div className="h-[calc(100vh-9rem)] md:h-[calc(100vh-10rem)] bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Skeleton className="h-7 w-32 rounded" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-3 p-2">
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-10 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded opacity-70" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area Skeleton (Desktop only for initial load) */}
      <div className="hidden md:flex flex-1 flex-col min-h-0 min-w-0 bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded opacity-60" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 space-y-6 overflow-hidden">
          <div className="flex justify-start">
            <div className="space-y-2">
              <Skeleton className="h-10 w-48 rounded-2xl rounded-tl-none" />
              <Skeleton className="h-10 w-32 rounded-2xl rounded-tl-none" />
            </div>
          </div>
          <div className="flex justify-end">
             <Skeleton className="h-10 w-56 rounded-2xl rounded-tr-none" />
          </div>
          <div className="flex justify-start">
             <Skeleton className="h-20 w-64 rounded-2xl rounded-tl-none" />
          </div>
          <div className="flex justify-end">
             <div className="space-y-2 flex flex-col items-end">
                <Skeleton className="h-10 w-40 rounded-2xl rounded-tr-none" />
                <Skeleton className="h-10 w-42 rounded-2xl rounded-tr-none" />
             </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
