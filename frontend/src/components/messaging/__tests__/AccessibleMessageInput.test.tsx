import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibleMessageInput from '../AccessibleMessageInput';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AccessibleMessageInput', () => {
  const mockProps = {
    value: '',
    onChange: jest.fn(),
    onSend: jest.fn(),
    selectedFiles: [],
    onFilesSelected: jest.fn(),
    onRemoveFile: jest.fn(),
    disabled: false,
    maxLength: 1000,
    placeholder: 'Type your message...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders input correctly', () => {
      render(<AccessibleMessageInput {...mockProps} />);
      
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      expect(screen.getByText('0/1000')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello world" />);
      
      const input = screen.getByDisplayValue('Hello world');
      expect(input).toBeInTheDocument();
      expect(screen.getByText('11/1000')).toBeInTheDocument();
    });

    it('shows character count correctly', () => {
      render(<AccessibleMessageInput {...mockProps} value="Test message" maxLength={500} />);
      
      expect(screen.getByText('12/500')).toBeInTheDocument();
    });
  });

  describe('Send Button Visibility', () => {
    it('hides send button when input is empty and no files selected', () => {
      render(<AccessibleMessageInput {...mockProps} />);
      
      expect(screen.queryByLabelText('sendMessage')).not.toBeInTheDocument();
    });

    it('shows send button when input has content', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      expect(screen.getByLabelText('sendMessage')).toBeInTheDocument();
    });

    it('shows send button when files are selected', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<AccessibleMessageInput {...mockProps} selectedFiles={[file]} />);
      
      expect(screen.getByLabelText('sendMessage')).toBeInTheDocument();
    });

    it('hides send button when input contains only whitespace', () => {
      render(<AccessibleMessageInput {...mockProps} value="   " />);
      
      expect(screen.queryByLabelText('sendMessage')).not.toBeInTheDocument();
    });

    it('shows send button when both text and files are present', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<AccessibleMessageInput {...mockProps} value="Check this out" selectedFiles={[file]} />);
      
      expect(screen.getByLabelText('sendMessage')).toBeInTheDocument();
    });
  });

  describe('Send Button States', () => {
    it('enables send button when content is valid', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      const sendButton = screen.getByLabelText('sendMessage');
      expect(sendButton).not.toBeDisabled();
    });

    it('disables send button when disabled prop is true', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" disabled={true} />);
      
      const sendButton = screen.getByLabelText('sendMessage');
      expect(sendButton).toBeDisabled();
    });

    it('disables send button when over character limit', () => {
      const longText = 'A'.repeat(1001);
      render(<AccessibleMessageInput {...mockProps} value={longText} maxLength={1000} />);
      
      const sendButton = screen.getByLabelText('sendMessage');
      expect(sendButton).toBeDisabled();
    });

    it('shows correct styling when over limit', () => {
      const longText = 'A'.repeat(1001);
      render(<AccessibleMessageInput {...mockProps} value={longText} maxLength={1000} />);
      
      const characterCount = screen.getByText('1001/1000');
      expect(characterCount).toHaveClass('text-red-500');
    });

    it('shows warning styling when near limit', () => {
      const nearLimitText = 'A'.repeat(850); // 85% of 1000
      render(<AccessibleMessageInput {...mockProps} value={nearLimitText} maxLength={1000} />);
      
      const characterCount = screen.getByText('850/1000');
      expect(characterCount).toHaveClass('text-yellow-500');
    });

    it('shows normal styling when under limit', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" maxLength={1000} />);
      
      const characterCount = screen.getByText('5/1000');
      expect(characterCount).toHaveClass('text-gray-500');
    });
  });

  describe('Input Behavior', () => {
    it('calls onChange when typing', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AccessibleMessageInput {...mockProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Hello');
      
      expect(onChange).toHaveBeenCalledWith('Hello');
    });

    it('calls onSend when send button is clicked', () => {
      const onSend = jest.fn();
      render(<AccessibleMessageInput {...mockProps} value="Hello" onSend={onSend} />);
      
      const sendButton = screen.getByLabelText('sendMessage');
      fireEvent.click(sendButton);
      
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('calls onSend when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSend = jest.fn();
      render(<AccessibleMessageInput {...mockProps} value="Hello" onSend={onSend} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '{enter}');
      
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('does not send when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSend = jest.fn();
      render(<AccessibleMessageInput {...mockProps} value="Hello" onSend={onSend} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, '{shift}{enter}');
      
      expect(onSend).not.toHaveBeenCalled();
    });

    it('handles multiline input with Shift+Enter', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AccessibleMessageInput {...mockProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.type(input, 'Line 1{shift}{enter}Line 2');
      
      expect(onChange).toHaveBeenCalledWith('Line 1\nLine 2');
    });
  });

  describe('File Handling', () => {
    it('displays selected files', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ];
      render(<AccessibleMessageInput {...mockProps} selectedFiles={files} />);
      
      expect(screen.getByText('test1.jpg')).toBeInTheDocument();
      expect(screen.getByText('test2.png')).toBeInTheDocument();
    });

    it('calls onFilesSelected when files are added', async () => {
      const user = userEvent.setup();
      const onFilesSelected = jest.fn();
      render(<AccessibleMessageInput {...mockProps} onFilesSelected={onFilesSelected} />);
      
      const fileInput = screen.getByLabelText(/attach files/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await user.upload(fileInput, file);
      
      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('calls onRemoveFile when file is removed', () => {
      const onRemoveFile = jest.fn();
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      render(<AccessibleMessageInput {...mockProps} selectedFiles={files} onRemoveFile={onRemoveFile} />);
      
      const removeButton = screen.getByLabelText(/remove.*test\.jpg/i);
      fireEvent.click(removeButton);
      
      expect(onRemoveFile).toHaveBeenCalledWith(0);
    });

    it('shows file count in attach button when files are selected', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ];
      render(<AccessibleMessageInput {...mockProps} selectedFiles={files} />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels', () => {
      render(<AccessibleMessageInput {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toHaveAttribute('aria-label', 'Type your message...');
      
      const fileInput = screen.getByLabelText(/attach files/i);
      expect(fileInput).toHaveAttribute('aria-label');
    });

    it('has proper role attributes', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      const sendButton = screen.getByLabelText('sendMessage');
      expect(sendButton).toHaveAttribute('type', 'button');
    });

    it('provides screen reader feedback for character count', () => {
      render(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      const characterCount = screen.getByText('5/1000');
      expect(characterCount).toBeInTheDocument();
    });

    it('provides screen reader feedback when over limit', () => {
      const longText = 'A'.repeat(1001);
      render(<AccessibleMessageInput {...mockProps} value={longText} maxLength={1000} />);
      
      const characterCount = screen.getByText('1001/1000');
      expect(characterCount).toHaveClass('text-red-500');
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      render(<AccessibleMessageInput {...mockProps} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      await user.click(input);
      
      expect(input).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty file selection', async () => {
      const user = userEvent.setup();
      const onFilesSelected = jest.fn();
      render(<AccessibleMessageInput {...mockProps} onFilesSelected={onFilesSelected} />);
      
      const fileInput = screen.getByLabelText(/attach files/i);
      
      // Simulate selecting no files
      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      expect(onFilesSelected).not.toHaveBeenCalled();
    });

    it('handles very long text input', () => {
      const veryLongText = 'A'.repeat(5000);
      render(<AccessibleMessageInput {...mockProps} value={veryLongText} maxLength={1000} />);
      
      const input = screen.getByDisplayValue(veryLongText);
      expect(input).toBeInTheDocument();
      expect(screen.getByText('5000/1000')).toBeInTheDocument();
    });

    it('handles special characters', () => {
      const specialText = '🚗 Hello! @user #hashtag $price 100% 🎉';
      render(<AccessibleMessageInput {...mockProps} value={specialText} />);
      
      const input = screen.getByDisplayValue(specialText);
      expect(input).toBeInTheDocument();
    });

    it('handles rapid state changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<AccessibleMessageInput {...mockProps} onChange={onChange} />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      
      // Rapid typing and clearing
      await user.type(input, 'Hello');
      await user.clear(input);
      await user.type(input, 'World');
      
      expect(onChange).toHaveBeenCalledWith('World');
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      // Re-render with same props
      rerender(<AccessibleMessageInput {...mockProps} value="Hello" />);
      
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument();
    });

    it('handles large file lists efficiently', () => {
      const manyFiles = Array.from({ length: 50 }, (_, i) => 
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      );
      
      render(<AccessibleMessageInput {...mockProps} selectedFiles={manyFiles} />);
      
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('test0.jpg')).toBeInTheDocument();
      expect(screen.getByText('test49.jpg')).toBeInTheDocument();
    });
  });
});
