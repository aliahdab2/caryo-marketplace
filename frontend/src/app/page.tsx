"use client";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { FaSearch, FaChevronDown } from "react-icons/fa";

export default function Home() {
  const { t } = useTranslation('common');
  
  // State for search form
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [city, setCity] = useState("");
  const [models, setModels] = useState<string[]>([]);
  
  // Mock data for dropdowns
  const makes = ["Toyota", "Honda", "Ford", "BMW", "Mercedes-Benz", "Audi", "Chevrolet", "Nissan"];
  const cities = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

  // Update available models when make changes
  useEffect(() => {
    if (make === "Toyota") {
      setModels(["Camry", "Corolla", "RAV4", "Highlander", "4Runner"]);
    } else if (make === "Honda") {
      setModels(["Civic", "Accord", "CR-V", "Pilot", "Odyssey"]);
    } else if (make === "Ford") {
      setModels(["F-150", "Escape", "Explorer", "Mustang", "Bronco"]);
    } else if (make === "BMW") {
      setModels(["3 Series", "5 Series", "X3", "X5", "7 Series"]);
    } else if (make === "Mercedes-Benz") {
      setModels(["C-Class", "E-Class", "GLC", "GLE", "S-Class"]);
    } else {
      setModels([]);
    }
    setModel("");
  }, [make]);
  // Example featured car data (this would come from an API in a real app)
  const featuredCars = [
    {
      id: 1,
      title: "2023 Mercedes-Benz C-Class",
      price: "$59,900",
      image: "/images/logo.png", // Using logo as placeholder, would be actual car image
      location: "Dubai",
      mileage: "5,000 km",
      fuelType: "Petrol",
      transmission: "Automatic",
    },
    {
      id: 2,
      title: "2022 BMW 5 Series",
      price: "$48,500",
      image: "/images/logo.png", // Using logo as placeholder, would be actual car image
      location: "Abu Dhabi",
      mileage: "12,000 km",
      fuelType: "Petrol",
      transmission: "Automatic",
    },
    {
      id: 3,
      title: "2023 Audi Q7",
      price: "$62,000",
      image: "/images/logo.png", // Using logo as placeholder, would be actual car image
      location: "Sharjah",
      mileage: "3,500 km",
      fuelType: "Petrol",
      transmission: "Automatic",
    },
  ];

  // Vehicle categories
  const categories = [
    { name: t("carsFeatures.sedan"), icon: "🚗", count: 128 },
    { name: t("carsFeatures.suv"), icon: "🚙", count: 96 },
    { name: t("carsFeatures.luxury"), icon: "✨", count: 64 },
    { name: t("carsFeatures.sports"), icon: "🏎️", count: 42 },
    { name: t("carsFeatures.electric"), icon: "⚡", count: 38 },
    { name: t("carsFeatures.convertible"), icon: "🚘", count: 27 },
  ];

  return (
    <div className="w-full">
      {/* Hero Section with full-width banner image */}
      <div className="relative h-[550px] w-full">
        <Image
          src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2070"
          alt="Car in motion on a scenic road"
          fill
          priority
          className="object-cover brightness-75"
          sizes="100vw"
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {t('home.hero.usedCarsNearYou', 'Used Cars for Sale Near You')}
            </h1>
            <p className="text-lg md:text-xl text-white">
              {t('home.hero.findPerfectCar', 'Find your next car with Caryo')}
            </p>
          </div>

          <form className="w-full max-w-3xl bg-white/90 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-2xl" onSubmit={(e) => {
            e.preventDefault();
            // Build the search URL with parameters
            const params = new URLSearchParams();
            if (make) params.append('make', make);
            if (model) params.append('model', model);
            if (city) params.append('city', city);
            
            // Navigate to the listings page with the search parameters
            window.location.href = `/listings?${params.toString()}`;
          }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">{t('search.make', 'Make')}</label>
                <div className="relative">
                  <select 
                    id="make" 
                    value={make} 
                    onChange={(e) => setMake(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-8"
                  >
                    <option value="" className="font-semibold">{t('search.anyMake', 'Any Make')}</option>
                    {makes.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">{t('search.model', 'Model')}</label>
                <div className="relative">
                  <select 
                    id="model" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)} 
                    disabled={!make || models.length === 0}
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-8 disabled:bg-gray-100"
                  >
                    <option value="" className="font-semibold">{t('search.anyModel', 'Any Model')}</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">{t('search.city', 'City')}</label>
                <div className="relative">
                  <select 
                    id="city" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none pr-8"
                  >
                    <option value="" className="font-semibold">{t('search.anyCity', 'Any City')}</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              <div>
                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-md shadow-md transition duration-150 ease-in-out flex items-center justify-center h-[46px]"
                >
                  <FaSearch className="mr-2 h-5 w-5" />
                  {t('search.searchCars', 'Search Cars')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Original content starts here */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-16 px-4 hidden">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t('home.hero.title')}
              </h1>
              <p className="text-xl mb-6">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/listings"
                  className="bg-white text-blue-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition duration-300 text-center"
                >
                  {t('home.hero.browseCars')}
                </Link>
                <Link
                  href="/sell"
                  className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white hover:text-blue-700 transition duration-300 text-center"
                >
                  {t('home.hero.sellYourCar')}
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md h-64 md:h-80">
                <Image
                  src="/images/logo.svg"
                  alt="Caryo marketplace logo showing a stylized car"
                  fill
                  style={{ objectFit: "contain" }}
                  className="drop-shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Cars Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">{t('home.featured')}</h2>
          <p className="text-gray-600 mb-8">
            {t('home.subtitle', 'Discover our handpicked selection of premium vehicles')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCars.map((car) => (
              <Link key={car.id} href={`/listings/${car.id}`} className="group">
                <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={car.image}
                      alt={car.title}
                      fill
                      style={{ objectFit: "cover" }}
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition duration-300">
                      {car.title}
                    </h3>
                    <h4 className="text-2xl font-bold text-blue-600 mb-3">
                      {car.price}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                      <span className="flex items-center gap-1">
                        📍{car.location}
                      </span>
                      <span className="flex items-center gap-1">
                        🛣️{car.mileage}
                      </span>
                      <span className="flex items-center gap-1">
                        ⛽{car.fuelType}
                      </span>
                      <span className="flex items-center gap-1">
                        🔄{car.transmission}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/listings"
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition duration-300 inline-block"
            >
              {t('home.viewAllListings')}
            </Link>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">{t('home.categories')}</h2>
          <p className="text-gray-600 mb-8">{t('home.categorySubtitle', 'Find vehicles that match your needs')}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/listings?category=${category.name.toLowerCase()}`}
                className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition duration-300 text-center"
                aria-label={`${category.name} category with ${category.count} listings`}
              >
                <div className="text-4xl mb-2" aria-hidden="true">{category.icon}</div>
                <h3 className="font-bold mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.count} listings</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">
            {t('home.whyChooseUs.title')}
          </h2>
          <p className="text-gray-600 mb-12 text-center">
            {t('home.whyChooseUs.subtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                🔍
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.whyChooseUs.wideSelection.title')}</h3>
              <p className="text-gray-600">
                {t('home.whyChooseUs.wideSelection.description')}
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                🛡️
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.whyChooseUs.secureTransactions.title')}</h3>
              <p className="text-gray-600">
                {t('home.whyChooseUs.secureTransactions.description')}
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                💬
              </div>
              <h3 className="text-xl font-bold mb-2">{t('home.whyChooseUs.expertSupport.title')}</h3>
              <p className="text-gray-600">
                {t('home.whyChooseUs.expertSupport.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
