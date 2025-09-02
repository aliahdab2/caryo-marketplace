import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleMessageInput } from '../AccessibleMessageInput';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock browser APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mocked-object-url'),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mocked-object-url'),
  writable: true,
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: jest.fn(),
  writable: true,
});

describe('AccessibleMessageInput', () => {
  const mockProps = {
    value: '',
    onChange: jest.fn(),
    onSend: jest.fn(),
    disabled: false,
    maxLength: 1000,
    placeholder: 'Type your message...',
    allowAttachments: true,
    acceptedFileTypes: "image/*,.pdf,.doc,.docx,.txt",
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders input correctly', () => {
      render(<AccessibleMessageInput {...mockProps} />);
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      expect(screen.getByLabelText('attachFile')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello world" />);
      
      const input = screen.getByDisplayValue('Hello world');
      expect(input).toBeInTheDocument();
      expect(screen.getByLabelText('sendMessage')).toBeInTheDocument();
    });

    it('shows send button when message has content', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      expect(screen.getByLabelText('sendMessage')).toBeInTheDocument();
    });

    it('hides send button when message is empty', () => {
      render(<AccessibleMessageInput {...mockProps} />);
      
      expect(screen.queryByLabelText('sendMessage')).not.toBeInTheDocument();
    });

    it('shows file upload button when attachments are allowed', () => {
      render(<AccessibleMessageInput {...mockProps} allowAttachments={true} />);
      
      expect(screen.getByLabelText('attachFile')).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AccessibleMessageInput {...mockProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');
      
      // userEvent.type calls onChange for each character individually
      expect(onChange).toHaveBeenCalledTimes(5);
      expect(onChange).toHaveBeenNthCalledWith(1, 'H');
      expect(onChange).toHaveBeenNthCalledWith(2, 'e');
      expect(onChange).toHaveBeenNthCalledWith(3, 'l');
      expect(onChange).toHaveBeenNthCalledWith(4, 'l');
      expect(onChange).toHaveBeenNthCalledWith(5, 'o');
    });

    it('calls onSend when send button is clicked', () => {
      const onSend = jest.fn();
      render(<AccessibleMessageInput {...mockProps} value="Hello" onSend={onSend} />);
      
      const sendButton = screen.getByLabelText('sendMessage');
      fireEvent.click(sendButton);
      
      expect(onSend).toHaveBeenCalledWith('Hello', []);
    });

    it('calls onSend when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSend = jest.fn();
      render(<AccessibleMessageInput {...mockProps} value="Hello" onSend={onSend} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '{enter}');
      
      expect(onSend).toHaveBeenCalledWith('Hello', []);
    });

    it('handles text input correctly', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AccessibleMessageInput {...mockProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Test');
      
      // Verify onChange was called for each character
      expect(onChange).toHaveBeenCalledTimes(4);
      expect(onChange).toHaveBeenNthCalledWith(1, 'T');
      expect(onChange).toHaveBeenNthCalledWith(2, 'e');
      expect(onChange).toHaveBeenNthCalledWith(3, 's');
      expect(onChange).toHaveBeenNthCalledWith(4, 't');
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels', () => {
      render(<AccessibleMessageInput {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toHaveAttribute('aria-label', 'messageInput');
      
      const attachButton = screen.getByLabelText('attachFile');
      expect(attachButton).toBeInTheDocument();
    });

    it('has proper keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      const attachButton = screen.getByLabelText('attachFile');
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByLabelText('sendMessage');
      
      // The hidden file input gets focus first, then attach button
      await user.tab();
      // Skip the hidden file input and check the next focusable element
      await user.tab();
      expect(attachButton).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    it('respects maxLength attribute', () => {
      render(<AccessibleMessageInput {...mockProps} maxLength={500} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toHaveAttribute('maxlength', '500');
    });
  });

  describe('File Upload', () => {
    it('shows file input when attachments are allowed', () => {
      render(<AccessibleMessageInput {...mockProps} allowAttachments={true} />);
      
      const fileInput = screen.getByRole('button', { name: 'attachFile' });
      expect(fileInput).toBeInTheDocument();
    });

    it('accepts correct file types', () => {
      render(<AccessibleMessageInput {...mockProps} acceptedFileTypes="image/*,.pdf" />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*,.pdf');
    });

    it('allows multiple file selection', () => {
      render(<AccessibleMessageInput {...mockProps} />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('multiple');
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<AccessibleMessageInput {...mockProps} disabled={true} />);
      
      const attachButton = screen.getByLabelText('attachFile');
      expect(attachButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });

    it('shows disabled send button when disabled', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" disabled={true} />);
      
      const sendButton = screen.getByLabelText('sendMessage');
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty message correctly', () => {
      const onSend = jest.fn();
      render(<AccessibleMessageInput {...mockProps} value="" onSend={onSend} />);
      
      // Should not show send button for empty message
      expect(screen.queryByLabelText('sendMessage')).not.toBeInTheDocument();
    });

    it('handles whitespace-only message', () => {
      const onSend = jest.fn();
      render(<AccessibleMessageInput {...mockProps} value="   " onSend={onSend} />);
      
      // Component trims whitespace, so no send button for whitespace-only
      expect(screen.queryByLabelText('sendMessage')).not.toBeInTheDocument();
    });

    it('handles very long messages', () => {
      const longMessage = 'A'.repeat(2000);
      render(<AccessibleMessageInput {...mockProps} value={longMessage} maxLength={1000} />);
      
      const input = screen.getByDisplayValue(longMessage);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('maxlength', '1000');
    });
  });
});


