import React from 'react';
import { Fuel, Zap, Battery, Flame, Droplets } from 'lucide-react';

interface FuelTypeIconProps {
  className?: string;
}

export const GasolineIcon: React.FC<FuelTypeIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center text-blue-600`}>
    <Fuel className="w-full h-full" />
  </div>
);

export const DieselIcon: React.FC<FuelTypeIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center text-green-600`}>
    <Droplets className="w-full h-full" />
  </div>
);

export const HybridIcon: React.FC<FuelTypeIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center text-purple-600`}>
    <Battery className="w-full h-full" />
  </div>
);

export const ElectricIcon: React.FC<FuelTypeIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center text-yellow-600`}>
    <Zap className="w-full h-full" />
  </div>
);

export const CNGIcon: React.FC<FuelTypeIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center text-orange-600`}>
    <Flame className="w-full h-full" />
  </div>
);

export const LPGIcon: React.FC<FuelTypeIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center text-red-600`}>
    <Fuel className="w-full h-full" />
  </div>
); 