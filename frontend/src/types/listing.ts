// Listing type definitions
export interface Listing {
  id: string;
  title: string;
  price: number;
  year: number;
  mileage: number;
  location: string;
  image: string;
  fuelType: string;
  transmission: string;
  listingDate: Date;
}
