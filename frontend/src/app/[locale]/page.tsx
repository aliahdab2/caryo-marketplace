import HomeClient from './HomeClient';
import {
  fetchLatestListingsPublic,
  fetchCarBrandsPublic,
  fetchGovernoratesPublic
} from "@/services/publicApi";

export default async function Home() {
  // Parallel data fetching for maximum speed (all server-side)
  const [latestCars, brands, governorates] = await Promise.all([
    fetchLatestListingsPublic(6),
    fetchCarBrandsPublic(),
    fetchGovernoratesPublic()
  ]);

  return (
    <main>
      <HomeClient 
        initialCars={latestCars}
        initialBrands={brands}
        initialGovernorates={governorates}
      />
    </main>
  );
}
