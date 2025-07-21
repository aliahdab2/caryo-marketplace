import { render } from '@testing-library/react';
import CarListingSkeleton from '../CarListingSkeleton';

describe('CarListingSkeleton', () => {
  it('renders without crashing', () => {
    render(<CarListingSkeleton />);
  });

  it('renders with custom className', () => {
    const { container } = render(<CarListingSkeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
  });

  it('has the correct structure', () => {
    const { container } = render(<CarListingSkeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    // Check main container classes
    expect(skeleton).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'border', 'border-gray-200', 'overflow-hidden', 'animate-pulse');
    
    // Check for image skeleton
    const imageDiv = skeleton.querySelector('.h-48');
    expect(imageDiv).toBeInTheDocument();
    expect(imageDiv).toHaveClass('bg-gray-300');
    
    // Check for content skeleton
    const contentDiv = skeleton.querySelector('.p-4');
    expect(contentDiv).toBeInTheDocument();
  });

  it('has displayName set correctly', () => {
    expect(CarListingSkeleton.displayName).toBe('CarListingSkeleton');
  });
});
