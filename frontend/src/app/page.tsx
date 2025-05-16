"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation('common');
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
    { name: "Sedan", icon: "🚗", count: 128 },
    { name: "SUV", icon: "🚙", count: 96 },
    { name: "Luxury", icon: "✨", count: 64 },
    { name: "Sports", icon: "🏎️", count: 42 },
    { name: "Electric", icon: "⚡", count: 38 },
    { name: "Convertible", icon: "🚘", count: 27 },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-16 px-4">
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
