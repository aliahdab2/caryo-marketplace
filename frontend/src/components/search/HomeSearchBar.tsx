"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface CarMake {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
  makeId: string;
}

const HomeSearchBar: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  
  const [availableModels, setAvailableModels] = useState<CarModel[]>([]);
  
  // Mock car data - in a real app, this would come from an API
  const carMakes: CarMake[] = [
    { id: 'toyota', name: 'Toyota' },
    { id: 'honda', name: 'Honda' },
    { id: 'bmw', name: 'BMW' },
    { id: 'mercedes', name: 'Mercedes-Benz' },
    { id: 'audi', name: 'Audi' },
  ];
  
  const carModels: CarModel[] = [
    { id: 'camry', name: 'Camry', makeId: 'toyota' },
    { id: 'corolla', name: 'Corolla', makeId: 'toyota' },
    { id: 'rav4', name: 'RAV4', makeId: 'toyota' },
    { id: 'civic', name: 'Civic', makeId: 'honda' },
    { id: 'accord', name: 'Accord', makeId: 'honda' },
    { id: 'crv', name: 'CR-V', makeId: 'honda' },
    { id: '3series', name: '3 Series', makeId: 'bmw' },
    { id: '5series', name: '5 Series', makeId: 'bmw' },
    { id: 'x5', name: 'X5', makeId: 'bmw' },
    { id: 'cclass', name: 'C-Class', makeId: 'mercedes' },
    { id: 'eclass', name: 'E-Class', makeId: 'mercedes' },
    { id: 'glc', name: 'GLC', makeId: 'mercedes' },
    { id: 'a4', name: 'A4', makeId: 'audi' },
    { id: 'q5', name: 'Q5', makeId: 'audi' },
    { id: 'a6', name: 'A6', makeId: 'audi' },
  ];
  
  const locations = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Tartus'];
  
  // Update available models when make changes
  useEffect(() => {
    if (selectedMake) {
      // Get models for the selected make
      const filteredModels = carModels.filter(model => model.makeId === selectedMake);
      setAvailableModels(filteredModels);
      setSelectedModel(''); // Reset model when make changes
    } else {
      setAvailableModels([]);
      setSelectedModel('');
    }
  }, [selectedMake]); // Remove carModels from dependency array as it's static
  
  const handleSearch = (e?: React.FormEvent) => {
    // Prevent default form submission behavior if event is provided
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (selectedMake) {
      params.append('make', selectedMake);
      
      // Find the make name for display purposes
      const makeName = carMakes.find(make => make.id === selectedMake)?.name;
      if (makeName) {
        params.append('makeName', makeName);
      }
    }
    
    if (selectedModel) {
      params.append('model', selectedModel);
      
      // Find the model name for display purposes
      const modelName = carModels.find(model => model.id === selectedModel)?.name;
      if (modelName) {
        params.append('modelName', modelName);
      }
    }
    
    if (location) {
      params.append('location', location);
    }
    
    router.push(`/listings?${params.toString()}`);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-5xl mx-auto">
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
        {/* Car Brand Dropdown */}
        <div className="md:col-span-2">
          <label htmlFor="carMake" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('home.searchBar.carBrand', 'Car Brand')}
          </label>
          <select
            id="carMake"
            className="w-full border border-gray-300 rounded-md py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={selectedMake}
            onChange={(e) => {
              const newMake = e.target.value;
              setSelectedMake(newMake);
            }}
          >
            <option value="">{t('home.searchBar.selectBrand', 'Select Brand')}</option>
            {carMakes.map((make) => (
              <option key={make.id} value={make.id}>
                {make.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Car Model Dropdown */}
        <div className="md:col-span-2">
          <label htmlFor="carModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('home.searchBar.carModel', 'Car Model')}
          </label>
          <select
            id="carModel"
            className="w-full border border-gray-300 rounded-md py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={selectedModel}
            onChange={(e) => {
              const newModel = e.target.value;
              setSelectedModel(newModel);
            }}
            disabled={!selectedMake || availableModels.length === 0}
          >
            <option value="">{t('home.searchBar.selectModel', 'Select Model')}</option>
            {!selectedMake ? (
              <option value="" disabled>
                {t('home.searchBar.selectBrandFirst', 'Select brand first')}
              </option>
            ) : availableModels.length > 0 ? (
              availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                {t('home.searchBar.noModelsAvailable', 'No models available')}
              </option>
            )}
          </select>
        </div>
        
        {/* Location Dropdown */}
        <div className="md:col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('home.searchBar.city', 'City')}
          </label>
          <select
            id="location"
            className="w-full border border-gray-300 rounded-md py-3 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="">{t('home.searchBar.selectCity', 'Select City')}</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        
        {/* Search Button */}
        <div className="md:col-span-1">
          <button
            type="submit"
            className="w-full h-[46px] bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition duration-300 flex items-center justify-center rtl:space-x-reverse"
            aria-label={t('home.searchBar.searchCars', 'Search Cars')}
          >
            <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>{t('home.searchBar.search', 'Search')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default HomeSearchBar;
