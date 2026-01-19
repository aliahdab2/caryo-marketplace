import { render } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies default medium size', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass('w-6');
    expect(spinner).toHaveClass('h-6');
  });

  it('applies small size when specified', () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass('w-4');
    expect(spinner).toHaveClass('h-4');
  });

  it('applies large size when specified', () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass('w-8');
    expect(spinner).toHaveClass('h-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="my-custom-class" />);
    const spinner = container.firstChild as HTMLElement;

    expect(spinner).toHaveClass('my-custom-class');
  });

  it('contains an animated spinner element', () => {
    const { container } = render(<Spinner />);
    const animatedElement = container.querySelector('.animate-spin');

    expect(animatedElement).toBeInTheDocument();
    expect(animatedElement).toHaveClass('rounded-full');
    expect(animatedElement).toHaveClass('border-2');
  });

  it('has proper border styling for visibility', () => {
    const { container } = render(<Spinner />);
    const animatedElement = container.querySelector('.animate-spin');

    expect(animatedElement).toHaveClass('border-gray-300');
    expect(animatedElement).toHaveClass('border-t-primary');
  });
});
