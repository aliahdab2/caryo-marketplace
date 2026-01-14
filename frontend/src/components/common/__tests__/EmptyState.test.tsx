import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('EmptyState', () => {
  it('should render with default variant', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('should render with custom title and message', () => {
    render(
      <EmptyState
        title="Custom Title"
        message="Custom message for empty state"
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message for empty state')).toBeInTheDocument();
  });

  it('should render search variant', () => {
    render(<EmptyState variant="search" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filters.')).toBeInTheDocument();
  });

  it('should render favorites variant', () => {
    render(<EmptyState variant="favorites" />);
    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
  });

  it('should render messages variant', () => {
    render(<EmptyState variant="messages" />);
    expect(screen.getByText('No messages')).toBeInTheDocument();
  });

  it('should render listings variant', () => {
    render(<EmptyState variant="listings" />);
    expect(screen.getByText('No listings')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    render(
      <EmptyState
        variant="favorites"
        action={<button>Browse Listings</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Browse Listings' })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<EmptyState className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render custom icon when provided', () => {
    render(
      <EmptyState
        icon={<div data-testid="custom-icon">Custom Icon</div>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
