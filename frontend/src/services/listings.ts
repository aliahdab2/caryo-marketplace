// Listings API service
import { Listing } from '@/types/listing';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export type ListingFilters = {
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  location?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
};

export async function getListings(filters: ListingFilters = {}): Promise<{ listings: Listing[], total: number }> {
  // In a real app, this would call the API with filters
  // For now, we'll simulate this with mock data
  const params = new URLSearchParams();
  
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  if (filters.minYear) params.append('minYear', filters.minYear);
  if (filters.maxYear) params.append('maxYear', filters.maxYear);
  if (filters.location) params.append('location', filters.location);
  if (filters.searchTerm) params.append('search', filters.searchTerm);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  
  // In a real implementation, you would fetch from the API:
  // const response = await fetch(`${API_URL}/api/listings?${params.toString()}`);
  // const data = await response.json();
  // return data;
  
  // For now, return mock data
  return mockListingsData(filters);
}

// Constants for mock data generation
const CITIES = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'];
const CAR_MODELS = ['Toyota Camry', 'Honda Accord', 'BMW 3 Series'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual'];

/**
 * Generate a random date within the last month
 * @returns ISO string date
 */
function getRandomRecentDate(): string {
  const now = Date.now();
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
  return new Date(now - Math.floor(Math.random() * oneMonthMs)).toISOString();
}

// Mock function to simulate API response
function mockListingsData(filters: ListingFilters = {}): { listings: Listing[], total: number } {
  // Generate 24 mock listings
  const allMockListings = Array.from({ length: 24 }, (_, i): Listing => {
    const city = CITIES[i % CITIES.length];
    const randomDate = getRandomRecentDate();
    
    return {
      id: `car-${i+1}`,
      title: `${CAR_MODELS[i % CAR_MODELS.length]} ${i+1}`,
      price: Math.floor(5000000 + Math.random() * 20000000), // Syrian Pound values (millions)
      year: Math.floor(2000 + Math.random() * 23),
      listingDate: new Date(randomDate),
      mileage: Math.floor(10000 + Math.random() * 100000),
      location: {
        city: city,
        country: 'Syria'
      },
      image: `/images/vehicles/car${(i % 5) + 1}.jpg`,
      fuelType: FUEL_TYPES[i % FUEL_TYPES.length],
      transmission: TRANSMISSIONS[i % TRANSMISSIONS.length],
      createdAt: randomDate,
    };
  });
  
  // Apply filters
  const filtered = allMockListings.filter(item => {
    // Price range filter
    if (filters.minPrice && item.price < parseInt(filters.minPrice as string)) {
      return false;
    }
    
    if (filters.maxPrice && item.price > parseInt(filters.maxPrice as string)) {
      return false;
    }
    
    // Year range filter
    if (filters.minYear && item.year < parseInt(filters.minYear as string)) {
      return false;
    }
    
    if (filters.maxYear && item.year > parseInt(filters.maxYear as string)) {
      return false;
    }
    
    // Location filter
    if (filters.location && filters.location !== 'All Locations') {
      const locationMatches = 
        (item.location?.city === filters.location) || 
        (item.location?.country === filters.location);
      
      if (!locationMatches) {
        return false;
      }
    }
    
    // Search term filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(term);
      const cityMatch = item.location?.city?.toLowerCase().includes(term) || false;
      const countryMatch = item.location?.country?.toLowerCase().includes(term) || false;
      
      if (!titleMatch && !cityMatch && !countryMatch) {
        return false;
      }
    }
    
    return true;
  });
  
  // Handle pagination
  const page = Math.max(1, filters.page || 1); // Ensure page is at least 1
  const limit = Math.max(1, Math.min(50, filters.limit || 8)); // Limit between 1 and 50, default 8
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = filtered.slice(startIndex, endIndex);
  
  return {
    listings: paginatedListings,
    total: filtered.length
  };
}
