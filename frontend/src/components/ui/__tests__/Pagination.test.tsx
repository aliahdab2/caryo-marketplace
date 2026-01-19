import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdChevronLeft: () => <span data-testid="chevron-left">←</span>,
  MdChevronRight: () => <span data-testid="chevron-right">→</span>,
}));

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalItems: 200,
    itemsPerPage: 20,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock scrollIntoView and scrollTo
    window.scrollTo = jest.fn();
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders pagination controls', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('does not render when totalPages is 1 or less', () => {
    const { container } = render(<Pagination {...defaultProps} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows results info when showInfo is true and totalItems provided', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText('1–20')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('hides results info when showInfo is false', () => {
    render(<Pagination {...defaultProps} showInfo={false} />);
    expect(screen.queryByText(/Showing/i)).not.toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    // Find by data-testid chevron-left since aria-label may vary with translations
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(btn => btn.querySelector('[data-testid="chevron-left"]'));
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} />);
    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => btn.querySelector('[data-testid="chevron-right"]'));
    expect(nextButton).toBeDisabled();
  });

  it('enables both buttons on middle page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(btn => btn.querySelector('[data-testid="chevron-left"]'));
    const nextButton = buttons.find(btn => btn.querySelector('[data-testid="chevron-right"]'));

    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it('calls onPageChange with previous page when previous button clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(btn => btn.querySelector('[data-testid="chevron-left"]'));
    if (prevButton) fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with next page when next button clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={5} onPageChange={onPageChange} />);

    const buttons = screen.getAllByRole('button');
    const nextButton = buttons.find(btn => btn.querySelector('[data-testid="chevron-right"]'));
    if (nextButton) fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('calls onPageChange when page number is clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />);

    // Click on page 3
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('does not call onPageChange when current page is clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText('1'));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('highlights current page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    const currentPageButton = screen.getByText('5');

    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    expect(currentPageButton).toHaveClass('bg-blue-600');
    expect(currentPageButton).toHaveClass('text-white');
  });

  it('shows ellipsis when there are many pages', () => {
    render(<Pagination {...defaultProps} currentPage={5} totalPages={20} />);
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('always shows first and last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} totalPages={20} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('applies RTL styling when isRTL is true', () => {
    render(<Pagination {...defaultProps} isRTL={true} />);
    const nav = screen.getByRole('navigation');

    expect(nav).toHaveAttribute('dir', 'rtl');
  });

  it('applies custom className', () => {
    render(<Pagination {...defaultProps} className="my-custom-class" />);
    const container = screen.getByRole('navigation').parentElement;

    expect(container).toHaveClass('my-custom-class');
  });

  it('shows correct range for middle pages', () => {
    render(<Pagination {...defaultProps} currentPage={5} itemsPerPage={20} totalItems={200} />);
    expect(screen.getByText('81–100')).toBeInTheDocument();
  });

  it('shows correct range for last page with partial items', () => {
    render(<Pagination {...defaultProps} currentPage={10} itemsPerPage={20} totalItems={195} />);
    expect(screen.getByText('181–195')).toBeInTheDocument();
  });

  it('returns null for invalid currentPage', () => {
    // Suppress console.warn for this test
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { container } = render(<Pagination {...defaultProps} currentPage={0} />);
    expect(container.firstChild).toBeNull();

    consoleSpy.mockRestore();
  });

  it('has proper accessibility labels', () => {
    render(<Pagination {...defaultProps} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');
    // Navigation buttons exist with chevron icons
    const buttons = screen.getAllByRole('button');
    expect(buttons.find(btn => btn.querySelector('[data-testid="chevron-left"]'))).toBeInTheDocument();
    expect(buttons.find(btn => btn.querySelector('[data-testid="chevron-right"]'))).toBeInTheDocument();
  });

  it('uses custom results text when provided', () => {
    render(
      <Pagination
        {...defaultProps}
        resultsText={{
          showing: 'Mostrando',
          of: 'de',
          items: 'elementos',
        }}
      />
    );

    // Custom text should appear in the results info
    const container = screen.getByRole('navigation').parentElement;
    expect(container?.textContent).toContain('Mostrando');
    expect(container?.textContent).toContain('elementos');
  });
});
