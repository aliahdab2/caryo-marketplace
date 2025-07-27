import React from 'react';
import { 
  GasolineIcon,
  DieselIcon,
  HybridIcon,
  ElectricIcon,
  CNGIcon,
  LPGIcon
} from '@/components/icons/FuelTypeIcons';

/**
 * Returns the appropriate fuel type icon based on fuel type name
 * @param fuelTypeName - The name of the fuel type
 * @param size - Optional size class (default: "w-16 h-12")
 * @returns React component for the corresponding fuel type icon
 */
export const getFuelTypeIcon = (fuelTypeName: string, size: string = "w-16 h-12"): React.ReactNode => {
  const normalizedName = fuelTypeName.toLowerCase();
  
  // Create a new icon map with the specified size
  const sizedIconMap: Record<string, React.ReactNode> = {
    'gasoline': <GasolineIcon className={size} />,
    'petrol': <GasolineIcon className={size} />,
    'diesel': <DieselIcon className={size} />,
    'hybrid': <HybridIcon className={size} />,
    'electric': <ElectricIcon className={size} />,
    'cng': <CNGIcon className={size} />,
    'lpg': <LPGIcon className={size} />,
    'natural gas': <CNGIcon className={size} />,
    'liquefied petroleum gas': <LPGIcon className={size} />
  };

  return sizedIconMap[normalizedName] || <GasolineIcon className={size} />;
}; 