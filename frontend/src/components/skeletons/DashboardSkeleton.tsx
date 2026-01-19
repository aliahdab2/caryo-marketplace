import Skeleton from "@/components/ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded-md opacity-70" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-3 w-32 rounded opacity-60" />
          </div>
        ))}
      </div>

      {/* Two-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart/Activity Skeleton */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[300px]">
             <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-8 w-24 rounded-lg" />
             </div>
             <Skeleton className="h-48 w-full rounded-xl" />
          </div>

          {/* Recent Items Table */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <Skeleton className="h-5 w-32 mb-4 rounded" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-16 rounded-md" />
                    <div className="flex-1 space-y-2">
                       <Skeleton className="h-4 w-full max-w-[200px] rounded" />
                       <Skeleton className="h-3 w-24 rounded opacity-70" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                 </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar/Secondary Area (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Actions / Status */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
             <Skeleton className="h-5 w-32 rounded mb-2" />
             <Skeleton className="h-10 w-full rounded-xl" />
             <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Notifications/Updates */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <Skeleton className="h-5 w-24 mb-4 rounded" />
             <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                   <div key={i} className="flex gap-3">
                      <Skeleton className="h-2 w-2 mt-2 rounded-full flex-shrink-0" />
                      <div className="space-y-1 flex-1">
                         <Skeleton className="h-3 w-full rounded" />
                         <Skeleton className="h-3 w-5/6 rounded" />
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
