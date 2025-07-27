import React from 'react';
import { render } from '@testing-library/react';
import {
  GasolineIcon,
  DieselIcon,
  HybridIcon,
  ElectricIcon,
  CNGIcon,
  LPGIcon
} from '../FuelTypeIcons';

describe('FuelTypeIcons', () => {
  describe('GasolineIcon', () => {
    it('should render with default size', () => {
      const { container } = render(<GasolineIcon />);
      expect(container.firstChild).toHaveClass('w-12', 'h-8');
    });

    it('should render with custom size', () => {
      const { container } = render(<GasolineIcon className="w-16 h-12" />);
      expect(container.firstChild).toHaveClass('w-16', 'h-12');
    });

    it('should have blue color', () => {
      const { container } = render(<GasolineIcon />);
      expect(container.firstChild).toHaveClass('text-blue-600');
    });

    it('should contain Fuel icon and blue dot', () => {
      const { container } = render(<GasolineIcon />);
      expect(container.innerHTML).toContain('lucide-fuel');
      expect(container.innerHTML).toContain('bg-blue-600');
    });
  });

  describe('DieselIcon', () => {
    it('should render with default size', () => {
      const { container } = render(<DieselIcon />);
      expect(container.firstChild).toHaveClass('w-12', 'h-8');
    });

    it('should render with custom size', () => {
      const { container } = render(<DieselIcon className="w-16 h-12" />);
      expect(container.firstChild).toHaveClass('w-16', 'h-12');
    });

    it('should have black color', () => {
      const { container } = render(<DieselIcon />);
      expect(container.firstChild).toHaveClass('text-black');
    });

    it('should contain Fuel icon and black dot', () => {
      const { container } = render(<DieselIcon />);
      expect(container.innerHTML).toContain('lucide-fuel');
      expect(container.innerHTML).toContain('bg-black');
    });
  });

  describe('HybridIcon', () => {
    it('should render with default size', () => {
      const { container } = render(<HybridIcon />);
      expect(container.firstChild).toHaveClass('w-12', 'h-8');
    });

    it('should render with custom size', () => {
      const { container } = render(<HybridIcon className="w-16 h-12" />);
      expect(container.firstChild).toHaveClass('w-16', 'h-12');
    });

    it('should have purple color', () => {
      const { container } = render(<HybridIcon />);
      expect(container.firstChild).toHaveClass('text-purple-600');
    });

    it('should contain Battery and Leaf icons', () => {
      const { container } = render(<HybridIcon />);
      expect(container.innerHTML).toContain('lucide-battery');
      expect(container.innerHTML).toContain('lucide-leaf');
    });
  });

  describe('ElectricIcon', () => {
    it('should render with default size', () => {
      const { container } = render(<ElectricIcon />);
      expect(container.firstChild).toHaveClass('w-12', 'h-8');
    });

    it('should render with custom size', () => {
      const { container } = render(<ElectricIcon className="w-16 h-12" />);
      expect(container.firstChild).toHaveClass('w-16', 'h-12');
    });

    it('should have yellow color', () => {
      const { container } = render(<ElectricIcon />);
      expect(container.firstChild).toHaveClass('text-yellow-600');
    });

    it('should contain Zap and Battery icons', () => {
      const { container } = render(<ElectricIcon />);
      expect(container.innerHTML).toContain('lucide-zap');
      expect(container.innerHTML).toContain('lucide-battery');
    });
  });

  describe('CNGIcon', () => {
    it('should render with default size', () => {
      const { container } = render(<CNGIcon />);
      expect(container.firstChild).toHaveClass('w-12', 'h-8');
    });

    it('should render with custom size', () => {
      const { container } = render(<CNGIcon className="w-16 h-12" />);
      expect(container.firstChild).toHaveClass('w-16', 'h-12');
    });

    it('should have orange color', () => {
      const { container } = render(<CNGIcon />);
      expect(container.firstChild).toHaveClass('text-orange-600');
    });

    it('should contain Flame and Atom icons', () => {
      const { container } = render(<CNGIcon />);
      expect(container.innerHTML).toContain('lucide-flame');
      expect(container.innerHTML).toContain('lucide-atom');
    });
  });

  describe('LPGIcon', () => {
    it('should render with default size', () => {
      const { container } = render(<LPGIcon />);
      expect(container.firstChild).toHaveClass('w-12', 'h-8');
    });

    it('should render with custom size', () => {
      const { container } = render(<LPGIcon className="w-16 h-12" />);
      expect(container.firstChild).toHaveClass('w-16', 'h-12');
    });

    it('should have red color', () => {
      const { container } = render(<LPGIcon />);
      expect(container.firstChild).toHaveClass('text-red-600');
    });

    it('should contain Fuel and Flame icons', () => {
      const { container } = render(<LPGIcon />);
      expect(container.innerHTML).toContain('lucide-fuel');
      expect(container.innerHTML).toContain('lucide-flame');
    });
  });

  describe('Icon consistency', () => {
    it('should have consistent structure across all icons', () => {
      const icons = [
        <GasolineIcon key="gasoline" />,
        <DieselIcon key="diesel" />,
        <HybridIcon key="hybrid" />,
        <ElectricIcon key="electric" />,
        <CNGIcon key="cng" />,
        <LPGIcon key="lpg" />
      ];

      icons.forEach(icon => {
        const { container } = render(icon);
        const iconElement = container.firstChild as HTMLElement;
        
        // All icons should have flex layout
        expect(iconElement).toHaveClass('flex', 'items-center', 'justify-center');
        
        // All icons should have a relative container inside
        const relativeContainer = iconElement.querySelector('.relative');
        expect(relativeContainer).toBeTruthy();
      });
    });

    it('should have different colors for different fuel types', () => {
      const { container: gasolineContainer } = render(<GasolineIcon />);
      const { container: dieselContainer } = render(<DieselIcon />);
      const { container: hybridContainer } = render(<HybridIcon />);
      const { container: electricContainer } = render(<ElectricIcon />);
      const { container: cngContainer } = render(<CNGIcon />);
      const { container: lpgContainer } = render(<LPGIcon />);

      expect(gasolineContainer.firstChild).toHaveClass('text-blue-600');
      expect(dieselContainer.firstChild).toHaveClass('text-black');
      expect(hybridContainer.firstChild).toHaveClass('text-purple-600');
      expect(electricContainer.firstChild).toHaveClass('text-yellow-600');
      expect(cngContainer.firstChild).toHaveClass('text-orange-600');
      expect(lpgContainer.firstChild).toHaveClass('text-red-600');
    });
  });
}); 