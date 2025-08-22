export interface MediaReorderItem {
  id: number;
  sortOrder: number;
}

/**
 * Reorder media items by updating their sortOrder
 * Uses the new backend endpoint PUT /api/listings/{id}/media/order
 */
export async function reorderMediaItems(listingId: string, items: MediaReorderItem[]): Promise<void> {
  try {
    // Import getSession at runtime to avoid SSR issues
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    
    if (!session?.accessToken) {
      throw new Error('You need to log in to reorder media');
    }
    
    console.log('Reordering media items:', { listingId, items });
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/listings/${listingId}/media/order`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify(items)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to reorder media: ${response.status}`);
    }
    
    console.log('Media reordered successfully');
  } catch (error) {
    console.error('Error reordering media:', error);
    throw error;
  }
}

/**
 * Check if the order of existing images has changed
 */
export function hasImageOrderChanged(
  originalUrls: string[],
  currentUrls: string[]
): boolean {
  if (originalUrls.length !== currentUrls.length) {
    return true;
  }
  
  return originalUrls.some((url, index) => url !== currentUrls[index]);
}

/**
 * Get the new order mapping for existing images
 */
export function getImageReorderMapping(
  originalUrls: string[],
  currentUrls: string[],
  existingMediaItems: Array<{ id: number; url: string }>
): MediaReorderItem[] {
  const reorderItems: MediaReorderItem[] = [];
  
  currentUrls.forEach((url, newIndex) => {
    const mediaItem = existingMediaItems.find(item => item.url === url);
    if (mediaItem) {
      reorderItems.push({
        id: mediaItem.id,
        sortOrder: newIndex
      });
    }
  });
  
  return reorderItems;
}
