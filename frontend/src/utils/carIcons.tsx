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



/**
 * Returns the appropriate car icon based on body style name
 * @param bodyStyleName - The name of the car body style
 * @param size - Optional size class (default: "w-16 h-12")
 * @returns React component for the corresponding car icon
 */
export const getCarIcon = (bodyStyleName: string, size: string = "w-16 h-12"): React.ReactNode => {
  const normalizedName = bodyStyleName.toLowerCase();
  
  // Create a new icon map with the specified size
  const sizedIconMap: Record<string, React.ReactNode> = {
    'sedan': <SedanIcon className={size} />,
    'saloon': <SedanIcon className={size} />,
    'hatchback': <HatchbackIcon className={size} />,
    'suv': <SUVIcon className={size} />,
    'coupe': <CoupeIcon className={size} />,
    'convertible': <ConvertibleIcon className={size} />,
    'wagon': <EstateIcon className={size} />,
    'estate': <EstateIcon className={size} />,
    'truck': <PickupIcon className={size} />,
    'pickup': <PickupIcon className={size} />,
    'van': <VanIcon className={size} />,
    'minivan': <MPVIcon className={size} />,
    'mpv': <MPVIcon className={size} />,
    'motorcycle': <MotorcycleIcon className={size} />,
    'crossover': <SUVIcon className={size} />,
    'taxi': <SedanIcon className={size} />,
    'ambulance': <VanIcon className={size} />,
    'rv': <VanIcon className={size} />,
    'camper': <VanIcon className={size} />,
    'other': <SedanIcon className={size} />
  };

  return sizedIconMap[normalizedName] || <SedanIcon className={size} />;
};
