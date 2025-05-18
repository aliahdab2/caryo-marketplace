import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { addToFavorites, removeFromFavorites, checkIsFavorite } from '@/services/favorites';

interface FavoriteButtonProps {
  listingId: string;
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function FavoriteButton({ 
  listingId, 
  className = '', 
  size = 24,
  showText = false 
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const status = await checkIsFavorite(listingId);
      setIsFavorite(status);
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  }, [listingId]);

  useEffect(() => {
    if (session) {
      checkFavoriteStatus();
    }
  }, [session, listingId, checkFavoriteStatus]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation(); // Prevent event bubbling

    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);
      if (isFavorite) {
        await removeFromFavorites(listingId);
      } else {
        await addToFavorites(listingId);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Show error toast or message
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center transition-colors ${
        isFavorite
          ? 'text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400'
          : 'text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? (
        <MdFavorite size={size} className={isLoading ? 'animate-pulse' : ''} />
      ) : (
        <MdFavoriteBorder size={size} className={isLoading ? 'animate-pulse' : ''} />
      )}
      {showText && (
        <span className="ml-2 text-sm">
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </span>
      )}
    </button>
  );
}