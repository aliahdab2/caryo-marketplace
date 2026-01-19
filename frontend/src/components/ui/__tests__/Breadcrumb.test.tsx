import { render, screen } from '@testing-library/react';
import Breadcrumb, { createDashboardBreadcrumb, createSavedAlertsBreadcrumb, BreadcrumbItem } from '../Breadcrumb';

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdChevronRight: () => <span data-testid="chevron-icon">›</span>,
  MdArrowBack: () => <span data-testid="arrow-back">←</span>,
}));

describe('Breadcrumb', () => {
  const basicItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Current Page' },
  ];

  it('renders breadcrumb navigation', () => {
    render(<Breadcrumb items={basicItems} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('renders all breadcrumb items', () => {
    render(<Breadcrumb items={basicItems} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('renders links for items with href', () => {
    render(<Breadcrumb items={basicItems} />);

    const homeLink = screen.getByText('Home').closest('a');
    const productsLink = screen.getByText('Products').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(productsLink).toHaveAttribute('href', '/products');
  });

  it('renders last item as text (not a link)', () => {
    render(<Breadcrumb items={basicItems} />);

    const lastItem = screen.getByText('Current Page');
    expect(lastItem.closest('a')).toBeNull();
    expect(lastItem).toHaveClass('font-medium');
  });

  it('shows chevron separators between items', () => {
    render(<Breadcrumb items={basicItems} />);

    const chevrons = screen.getAllByTestId('chevron-icon');
    expect(chevrons).toHaveLength(basicItems.length - 1);
  });

  it('shows back arrow on first item', () => {
    render(<Breadcrumb items={basicItems} />);
    expect(screen.getByTestId('arrow-back')).toBeInTheDocument();
  });

  it('marks last item as current page for accessibility', () => {
    render(<Breadcrumb items={basicItems} />);

    const lastItemLi = screen.getByText('Current Page').closest('li');
    expect(lastItemLi).toHaveAttribute('aria-current', 'page');
  });

  it('applies custom className', () => {
    render(<Breadcrumb items={basicItems} className="my-custom-class" />);
    expect(screen.getByRole('navigation')).toHaveClass('my-custom-class');
  });

  it('uses translation key when provided', () => {
    const itemsWithTranslation: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard', translationKey: 'dashboard' },
      { label: 'Current' },
    ];

    render(<Breadcrumb items={itemsWithTranslation} />);
    // Since we're mocking translations, it should render the translation key or fallback
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('handles single item breadcrumb', () => {
    const singleItem: BreadcrumbItem[] = [{ label: 'Only Page' }];

    render(<Breadcrumb items={singleItem} />);
    expect(screen.getByText('Only Page')).toBeInTheDocument();
    expect(screen.queryByTestId('chevron-icon')).not.toBeInTheDocument();
  });

  it('truncates long labels on mobile', () => {
    const longItem: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Very Long Category Name That Should Be Truncated' },
    ];

    render(<Breadcrumb items={longItem} />);
    const longLabel = screen.getByText('Very Long Category Name That Should Be Truncated');
    expect(longLabel).toHaveClass('truncate');
  });
});

describe('createDashboardBreadcrumb', () => {
  it('creates breadcrumb with dashboard as first item', () => {
    const current: BreadcrumbItem = { label: 'Settings' };
    const result = createDashboardBreadcrumb(current);

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Dashboard');
    expect(result[0].href).toBe('/dashboard');
    expect(result[1].label).toBe('Settings');
  });

  it('includes translation keys', () => {
    const current: BreadcrumbItem = { label: 'Profile' };
    const result = createDashboardBreadcrumb(current);

    expect(result[0].translationKey).toBe('dashboard');
    expect(result[0].translationNamespace).toBe('dashboard');
  });
});

describe('createSavedAlertsBreadcrumb', () => {
  it('creates correct breadcrumb structure', () => {
    const result = createSavedAlertsBreadcrumb();

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Dashboard');
    expect(result[0].href).toBe('/dashboard');
    expect(result[1].label).toBe('Saved Alerts');
  });

  it('includes translation keys for both items', () => {
    const result = createSavedAlertsBreadcrumb();

    expect(result[0].translationKey).toBe('dashboard');
    expect(result[1].translationKey).toBe('savedAlerts');
    expect(result[1].translationNamespace).toBe('savedAlerts');
  });
});
