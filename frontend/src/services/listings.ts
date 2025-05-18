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

// Mock function to simulate API response
function mockListingsData(filters: ListingFilters = {}): { listings: Listing[], total: number } {
  // Generate 24 mock listings
  const allMockListings = Array.from({ length: 24 }, (_, i) => ({
    id: `car-${i+1}`,
    title: `${i % 3 === 0 ? 'Toyota Camry' : i % 3 === 1 ? 'Honda Accord' : 'BMW 3 Series'} ${i+1}`,
    price: Math.floor(5000000 + Math.random() * 20000000), // Syrian Pound values (millions)
    year: Math.floor(2000 + Math.random() * 23),
    listingDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
    mileage: Math.floor(10000 + Math.random() * 100000),
    location: i % 5 === 0 ? 'Damascus' : i % 5 === 1 ? 'Aleppo' : i % 5 === 2 ? 'Homs' : i % 5 === 3 ? 'Latakia' : 'Hama',
    image: `/images/vehicles/car${(i % 5) + 1}.jpg`,
    fuelType: i % 3 === 0 ? 'Petrol' : i % 3 === 1 ? 'Diesel' : 'Electric',
    transmission: i % 2 === 0 ? 'Automatic' : 'Manual',
  }));
  
  // Apply filters
  let filtered = [...allMockListings];
  
  if (filters.minPrice) {
    filtered = filtered.filter(item => item.price >= parseInt(filters.minPrice as string));
  }
  
  if (filters.maxPrice) {
    filtered = filtered.filter(item => item.price <= parseInt(filters.maxPrice as string));
  }
  
  if (filters.minYear) {
    filtered = filtered.filter(item => item.year >= parseInt(filters.minYear as string));
  }
  
  if (filters.maxYear) {
    filtered = filtered.filter(item => item.year <= parseInt(filters.maxYear as string));
  }
  
  if (filters.location && filters.location !== 'All Locations') {
    filtered = filtered.filter(item => item.location === filters.location);
  }
  
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(term) || 
      item.location.toLowerCase().includes(term)
    );
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
