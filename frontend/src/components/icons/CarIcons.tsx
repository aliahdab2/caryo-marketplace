import React from 'react';
import { 
  FaCar, 
  FaCaravan,
  FaBus
} from 'react-icons/fa';
import { 
  RiCarFill
} from 'react-icons/ri';
import { 
  TbCar,
  TbCarSuv,
  TbTruck,
  TbMotorbike
} from 'react-icons/tb';

interface CarIconProps {
  className?: string;
}

// Professional automotive icons using popular icon libraries
export const ConvertibleIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <TbCar className={className} />
);

export const CoupeIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <RiCarFill className={className} />
);

export const EstateIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <FaCar className={className} />
);

export const HatchbackIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <FaCar className={className} />
);

export const MPVIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <FaBus className={className} />
);

export const PickupIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <TbTruck className={className} />
);

export const SedanIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <TbCar className={className} />
);

export const SUVIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <TbCarSuv className={className} />
);

export const VanIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <FaCaravan className={className} />
);

export const MotorcycleIcon: React.FC<CarIconProps> = ({ className = "w-8 h-8" }) => (
  <TbMotorbike className={className} />
);
