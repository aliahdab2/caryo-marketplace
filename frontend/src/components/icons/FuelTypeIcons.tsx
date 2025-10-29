import React from 'react';
import { Fuel, Zap, Battery, Flame, Leaf, Atom } from 'lucide-react';

interface FuelTypeIconProps {
  className?: string;
}

export const GasolineIcon: React.FC<FuelTypeIconProps> = ({ className = "w-12 h-8" }) => (
  <div className={`${className} flex items-center justify-center text-blue-600`}>
    <div className="relative">
      <Fuel className="w-full h-full" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
    </div>
  </div>
);

export const DieselIcon: React.FC<FuelTypeIconProps> = ({ className = "w-12 h-8" }) => (
  <div className={`${className} flex items-center justify-center text-black`}>
    <div className="relative">
      <Fuel className="w-full h-full" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-black rounded-full border-2 border-white"></div>
    </div>
  </div>
);

export const HybridIcon: React.FC<FuelTypeIconProps> = ({ className = "w-12 h-8" }) => (
  <div className={`${className} flex items-center justify-center text-purple-600`}>
    <div className="relative">
      <div className="flex items-center space-x-1">
        <Battery className="w-6 h-6" />
        <Leaf className="w-4 h-4" />
      </div>
    </div>
  </div>
);

export const ElectricIcon: React.FC<FuelTypeIconProps> = ({ className = "w-12 h-8" }) => (
  <div className={`${className} flex items-center justify-center text-yellow-600`}>
    <div className="relative">
      <div className="flex items-center space-x-1">
        <Zap className="w-6 h-6" />
        <Battery className="w-4 h-4" />
      </div>
    </div>
  </div>
);

export const CNGIcon: React.FC<FuelTypeIconProps> = ({ className = "w-12 h-8" }) => (
  <div className={`${className} flex items-center justify-center text-orange-600`}>
    <div className="relative">
      <div className="flex items-center space-x-1">
        <Flame className="w-6 h-6" />
        <Atom className="w-4 h-4" />
      </div>
    </div>
  </div>
);

export const LPGIcon: React.FC<FuelTypeIconProps> = ({ className = "w-12 h-8" }) => (
  <div className={`${className} flex items-center justify-center text-red-600`}>
    <div className="relative">
      <div className="flex items-center space-x-1">
        <Fuel className="w-6 h-6" />
        <Flame className="w-4 h-4" />
      </div>
    </div>
  </div>
);