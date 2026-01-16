/**
 * Social Links Utilities
 * Parse and serialize social links between array format (UI) and object format (API)
 */

export interface SocialLinkEntry {
  platform: string;
  url: string;
}

/**
 * Parse social links from JSON string to array format
 * Handles both legacy object format and new array format
 * 
 * @param jsonString - JSON string from API (e.g., '{"facebook":"url","instagram":"url"}')
 * @returns Array of social link entries
 */
export function parseSocialLinks(jsonString?: string | null): SocialLinkEntry[] {
  if (!jsonString) return [];
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Handle already-array format (future-proof)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is SocialLinkEntry =>
          typeof item === 'object' &&
          typeof item.platform === 'string' &&
          typeof item.url === 'string'
      );
    }
    
    // Handle legacy object format { facebook: "url", instagram: "url" }
    if (typeof parsed === 'object' && parsed !== null) {
      const entries: SocialLinkEntry[] = [];
      for (const [platform, url] of Object.entries(parsed)) {
        if (url && typeof url === 'string') {
          entries.push({ platform, url });
        }
      }
      return entries;
    }
    
    return [];
  } catch {
    return [];
  }
}

/**
 * Convert social links array to JSON string (stored as object for API compatibility)
 * 
 * @param links - Array of social link entries
 * @returns JSON string in object format (e.g., '{"facebook":"url"}')
 */
export function socialLinksToJson(links: SocialLinkEntry[]): string {
  if (!links || !Array.isArray(links) || links.length === 0) return '';
  
  const obj: Record<string, string> = {};
  for (const link of links) {
    if (link.platform && link.url && link.url.trim()) {
      obj[link.platform] = link.url.trim();
    }
  }
  
  return Object.keys(obj).length > 0 ? JSON.stringify(obj) : '';
}

/**
 * Available social platforms configuration
 */
export const SOCIAL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/yourdealership', color: 'text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: '📷', placeholder: 'https://instagram.com/yourdealership', color: 'text-pink-600' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', placeholder: '+963912345678', color: 'text-green-600' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', placeholder: 'https://youtube.com/@yourdealership', color: 'text-red-600' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@yourdealership', color: 'text-gray-900' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', placeholder: 'https://x.com/yourdealership', color: 'text-gray-900' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/company/yourdealership', color: 'text-blue-700' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', placeholder: 'yourusername', color: 'text-yellow-500' },
  { id: 'telegram', name: 'Telegram', icon: '✈️', placeholder: 'https://t.me/yourdealership', color: 'text-blue-500' },
  { id: 'website', name: 'Website', icon: '🌐', placeholder: 'https://yourdealership.com', color: 'text-gray-600' },
] as const;

/**
 * Get platform info by ID
 */
export function getPlatformInfo(platformId: string) {
  return SOCIAL_PLATFORMS.find((p) => p.id === platformId);
}
