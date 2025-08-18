import Link from 'next/link';

export default function ListingNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <span className="text-2xl">🚗</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Listing not found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This listing does not exist or is not publicly available yet. It may still be pending approval.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}


