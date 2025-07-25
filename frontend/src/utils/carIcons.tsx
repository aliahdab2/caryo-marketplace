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
  'sedan': <SedanIcon className="w-16 h-12" />,
  'saloon': <SedanIcon className="w-16 h-12" />,
  'hatchback': <HatchbackIcon className="w-16 h-12" />,
  'suv': <SUVIcon className="w-16 h-12" />,
  'coupe': <CoupeIcon className="w-16 h-12" />,
  'convertible': <ConvertibleIcon className="w-16 h-12" />,
  'wagon': <EstateIcon className="w-16 h-12" />,
  'estate': <EstateIcon className="w-16 h-12" />,
  'truck': <PickupIcon className="w-16 h-12" />,
  'pickup': <PickupIcon className="w-16 h-12" />,
  'van': <VanIcon className="w-16 h-12" />,
  'minivan': <MPVIcon className="w-16 h-12" />,
  'mpv': <MPVIcon className="w-16 h-12" />,
  'motorcycle': <MotorcycleIcon className="w-16 h-12" />,
  'crossover': <SUVIcon className="w-16 h-12" />,
  'taxi': <SedanIcon className="w-16 h-12" />,
  'ambulance': <VanIcon className="w-16 h-12" />,
  'rv': <VanIcon className="w-16 h-12" />,
  'camper': <VanIcon className="w-16 h-12" />,
  'other': <SedanIcon className="w-16 h-12" />
};

/**
 * Returns the appropriate car icon based on body style name
 * @param bodyStyleName - The name of the car body style
 * @returns React component for the corresponding car icon
 */
export const getCarIcon = (bodyStyleName: string): React.ReactNode => {
  const normalizedName = bodyStyleName.toLowerCase();

  return iconMap[normalizedName] || <SedanIcon className="w-16 h-12" />;
};
