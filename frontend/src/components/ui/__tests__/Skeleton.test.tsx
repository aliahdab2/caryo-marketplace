import { render } from '@testing-library/react';
import Skeleton from '../Skeleton';

describe('Skeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('bg-gray-300');
    expect(skeleton).toHaveClass('rounded');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-full mb-2" />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveClass('h-4');
    expect(skeleton).toHaveClass('w-full');
    expect(skeleton).toHaveClass('mb-2');
  });

  it('supports dark mode classes', () => {
    const { container } = render(<Skeleton className="dark:bg-gray-700" />);
    const skeleton = container.firstChild as HTMLElement;
    
    // Tailwind dark mode classes are applied via className
    expect(skeleton.className).toContain('dark:bg-gray-700');
  });

  it('has aria-hidden attribute for accessibility', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('has correct displayName', () => {
    expect(Skeleton.displayName).toBe('Skeleton');
  });

  it('can render multiple skeletons with different sizes', () => {
    const { container } = render(
      <div>
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );

    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons).toHaveLength(3);
  });
});
