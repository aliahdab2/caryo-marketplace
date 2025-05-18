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
const CAR_MAKES_MODELS = [
  { make: 'Toyota', models: ['Camry', 'Corolla', 'RAV4', 'Land Cruiser'] },
  { make: 'Honda', models: ['Accord', 'Civic', 'CR-V', 'Pilot'] },
  { make: 'BMW', models: ['3 Series', '5 Series', 'X3', 'X5'] },
  { make: 'Mercedes', models: ['C-Class', 'E-Class', 'GLC', 'S-Class'] },
  { make: 'Hyundai', models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe'] }
];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'DCT'];

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
    const makeModelIndex = i % CAR_MAKES_MODELS.length;
    const make = CAR_MAKES_MODELS[makeModelIndex].make;
    const model = CAR_MAKES_MODELS[makeModelIndex].models[i % CAR_MAKES_MODELS[makeModelIndex].models.length];
    const city = CITIES[i % CITIES.length];
    const randomDate = getRandomRecentDate();
    
    return {
      id: `car-${i+1}`,
      title: `${make} ${model} ${i+1}`,
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
  let filtered = [...allMockListings];
  
  // Parse numeric filters safely
  const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
  const minYear = filters.minYear ? Number(filters.minYear) : null;
  const maxYear = filters.maxYear ? Number(filters.maxYear) : null;
  
  // Apply numeric filters only if they parsed correctly
  if (minPrice !== null && !isNaN(minPrice)) {
    filtered = filtered.filter(item => item.price >= minPrice);
  }
  
  if (maxPrice !== null && !isNaN(maxPrice)) {
    filtered = filtered.filter(item => item.price <= maxPrice);
  }
  
  if (minYear !== null && !isNaN(minYear)) {
    filtered = filtered.filter(item => item.year >= minYear);
  }
  
  if (maxYear !== null && !isNaN(maxYear)) {
    filtered = filtered.filter(item => item.year <= maxYear);
  }
  
  if (filters.location && filters.location !== 'All Locations') {
    filtered = filtered.filter(item => 
      item.location?.city === filters.location || 
      item.location?.country === filters.location
    );
  }
  
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(item => {
      // Expanded search to include more fields
      const titleMatch = item.title.toLowerCase().includes(term);
      const cityMatch = item.location?.city?.toLowerCase().includes(term) || false;
      const countryMatch = item.location?.country?.toLowerCase().includes(term) || false;
      const fuelMatch = item.fuelType?.toLowerCase().includes(term) || false;
      const transMatch = item.transmission?.toLowerCase().includes(term) || false;
      const yearMatch = String(item.year).includes(term);
      
      return titleMatch || cityMatch || countryMatch || fuelMatch || transMatch || yearMatch;
    });
  }
  
  // Handle pagination
  const page = filters.page || 1;
  const limit = filters.limit || 8;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = filtered.slice(startIndex, endIndex);
  
  return {
    listings: paginatedListings,
    total: filtered.length
  };
}
