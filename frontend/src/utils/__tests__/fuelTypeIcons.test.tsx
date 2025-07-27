import React from 'react';
import { render } from '@testing-library/react';
import { getFuelTypeIcon } from '../fuelTypeIcons';

describe('getFuelTypeIcon', () => {
  it('should return gasoline icon for gasoline fuel type', () => {
    const { container } = render(<div>{getFuelTypeIcon('gasoline')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return diesel icon for diesel fuel type', () => {
    const { container } = render(<div>{getFuelTypeIcon('diesel')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return hybrid icon for hybrid fuel type', () => {
    const { container } = render(<div>{getFuelTypeIcon('hybrid')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return electric icon for electric fuel type', () => {
    const { container } = render(<div>{getFuelTypeIcon('electric')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return CNG icon for cng fuel type', () => {
    const { container } = render(<div>{getFuelTypeIcon('cng')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return LPG icon for lpg fuel type', () => {
    const { container } = render(<div>{getFuelTypeIcon('lpg')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return gasoline icon for petrol fuel type (alias)', () => {
    const { container } = render(<div>{getFuelTypeIcon('petrol')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return CNG icon for natural gas fuel type (alias)', () => {
    const { container } = render(<div>{getFuelTypeIcon('natural gas')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return LPG icon for liquefied petroleum gas fuel type (alias)', () => {
    const { container } = render(<div>{getFuelTypeIcon('liquefied petroleum gas')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return gasoline icon for unknown fuel type (fallback)', () => {
    const { container } = render(<div>{getFuelTypeIcon('unknown')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should return gasoline icon for empty string (fallback)', () => {
    const { container } = render(<div>{getFuelTypeIcon('')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should apply custom size when provided', () => {
    const { container } = render(<div>{getFuelTypeIcon('gasoline', 'w-20 h-16')}</div>);
    expect(container).toMatchSnapshot();
  });

  it('should handle case insensitive fuel type names', () => {
    const { container: container1 } = render(<div>{getFuelTypeIcon('GASOLINE')}</div>);
    const { container: container2 } = render(<div>{getFuelTypeIcon('gasoline')}</div>);
    
    // Both should render the same icon
    expect(container1.innerHTML).toBe(container2.innerHTML);
  });

  it('should handle mixed case fuel type names', () => {
    const { container: container1 } = render(<div>{getFuelTypeIcon('Hybrid')}</div>);
    const { container: container2 } = render(<div>{getFuelTypeIcon('hybrid')}</div>);
    
    // Both should render the same icon
    expect(container1.innerHTML).toBe(container2.innerHTML);
  });

  it('should return different icons for different fuel types', () => {
    const { container: gasolineContainer } = render(<div>{getFuelTypeIcon('gasoline')}</div>);
    const { container: dieselContainer } = render(<div>{getFuelTypeIcon('diesel')}</div>);
    const { container: electricContainer } = render(<div>{getFuelTypeIcon('electric')}</div>);
    
    // All should render different icons
    expect(gasolineContainer.innerHTML).not.toBe(dieselContainer.innerHTML);
    expect(dieselContainer.innerHTML).not.toBe(electricContainer.innerHTML);
    expect(gasolineContainer.innerHTML).not.toBe(electricContainer.innerHTML);
  });
}); 