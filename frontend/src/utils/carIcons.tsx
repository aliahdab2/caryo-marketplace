import React from 'react';
import { 
  ConvertibleIcon,
  CoupeIcon,
  EstateIcon,
  HatchbackIcon,
  MPVIcon,
  PickupIcon,
  SedanIcon,
  SUVIcon,
  VanIcon,
  MotorcycleIcon
} from '@/components/icons/CarIcons';

// Icon map defined outside the function to prevent recreation on every call
const iconMap: Record<string, React.ReactNode> = {
  'sedan': <SedanIcon className="w-8 h-6 text-gray-600" />,
  'saloon': <SedanIcon className="w-8 h-6 text-gray-600" />,
  'hatchback': <HatchbackIcon className="w-8 h-6 text-gray-600" />,
  'suv': <SUVIcon className="w-8 h-6 text-gray-600" />,
  'coupe': <CoupeIcon className="w-8 h-6 text-gray-600" />,
  'convertible': <ConvertibleIcon className="w-8 h-6 text-gray-600" />,
  'wagon': <EstateIcon className="w-8 h-6 text-gray-600" />,
  'estate': <EstateIcon className="w-8 h-6 text-gray-600" />,
  'truck': <PickupIcon className="w-8 h-6 text-gray-600" />,
  'pickup': <PickupIcon className="w-8 h-6 text-gray-600" />,
  'van': <VanIcon className="w-8 h-6 text-gray-600" />,
  'minivan': <MPVIcon className="w-8 h-6 text-gray-600" />,
  'mpv': <MPVIcon className="w-8 h-6 text-gray-600" />,
  'motorcycle': <MotorcycleIcon className="w-8 h-6 text-gray-600" />,
  'crossover': <SUVIcon className="w-8 h-6 text-gray-600" />,
  'taxi': <SedanIcon className="w-8 h-6 text-gray-600" />,
  'ambulance': <VanIcon className="w-8 h-6 text-gray-600" />,
  'rv': <VanIcon className="w-8 h-6 text-gray-600" />,
  'camper': <VanIcon className="w-8 h-6 text-gray-600" />,
  'other': <SedanIcon className="w-8 h-6 text-gray-600" />
};

/**
 * Returns the appropriate car icon based on body style name
 * @param bodyStyleName - The name of the car body style
 * @returns React component for the corresponding car icon
 */
export const getCarIcon = (bodyStyleName: string): React.ReactNode => {
  const normalizedName = bodyStyleName.toLowerCase();

  return iconMap[normalizedName] || <SedanIcon className="w-8 h-6 text-gray-600" />;
};
