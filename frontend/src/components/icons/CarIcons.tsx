import React from 'react';
import Image from 'next/image';

interface CarIconProps {
  className?: string;
}

// Professional car silhouette icons using real PNG images from autotrader.co.uk
// Clean, minimalist, realistic side-profile car silhouettes

export const ConvertibleIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/convertible.png"
      alt="Convertible"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const CoupeIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/coupe.png"
      alt="Coupe"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const EstateIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/estate.png"
      alt="Estate"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const HatchbackIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/hatchback.png"
      alt="Hatchback"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const MPVIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/mpv.png"
      alt="MPV"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const PickupIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/pickup.png"
      alt="Pickup"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const SedanIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/saloon.png"
      alt="Sedan"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const SUVIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/suv.png"
      alt="SUV"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const VanIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/mpv.png"
      alt="Van"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);

export const MotorcycleIcon: React.FC<CarIconProps> = ({ className = "w-16 h-12" }) => (
  <div className={`${className} flex items-center justify-center`}>
    <Image
      src="/images/body-types/coupe.png"
      alt="Motorcycle"
      width={67}
      height={50}
      className="w-full h-full object-contain"
    />
  </div>
);
