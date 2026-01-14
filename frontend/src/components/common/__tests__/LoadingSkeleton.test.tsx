import { render, screen } from '@testing-library/react';
import { LoadingSkeleton, CardSkeleton, ListSkeleton } from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('should render single skeleton by default', () => {
    render(<LoadingSkeleton />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('should render multiple skeletons when count is specified', () => {
    render(<LoadingSkeleton count={5} />);
    expect(screen.getAllByRole('status')).toHaveLength(5);
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSkeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should apply custom height and width styles', () => {
    render(<LoadingSkeleton height={100} width={200} />);
    const skeleton = screen.getByRole('status');
    expect(skeleton).toHaveStyle({ height: '100px', width: '200px' });
  });

  it('should have accessible loading label', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
  });
});

describe('CardSkeleton', () => {
  it('should render card skeletons', () => {
    const { container } = render(<CardSkeleton count={3} />);
    // Should render a grid with 3 card skeletons
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('should have grid layout', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toHaveClass('grid');
  });
});

describe('ListSkeleton', () => {
  it('should render list skeletons', () => {
    const { container } = render(<ListSkeleton count={4} />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4);
  });

  it('should default to 5 items', () => {
    const { container } = render(<ListSkeleton />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);
  });
});
