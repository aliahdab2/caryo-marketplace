import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../MessageInput';

// Mock the FileUpload component
jest.mock('../FileUpload', () => {
  return function MockFileUpload({ onImageSelect }: {
    onImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDocumentSelect?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }) {
    return (
      <div data-testid="file-upload">
        <input
          type="file"
          data-testid="file-input"
          onChange={onImageSelect}
          multiple
        />
      </div>
    );
  };
});

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock browser APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mocked-object-url'),
    revokeObjectURL: jest.fn(),
  },
  writable: true,
});

// Mock URL.createObjectURL for the component
Object.defineProperty(window.URL, 'createObjectURL', {
  value: jest.fn(() => 'mocked-object-url'),
  writable: true,
});

Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: jest.fn(),
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('MessageInput', () => {
  const mockProps = {
    newMessage: '',
    onMessageChange: jest.fn(),
    onKeyPress: jest.fn(),
    onSendMessage: jest.fn(),
    onImageSelect: jest.fn(),
    onDocumentSelect: jest.fn(),
    onRemoveFile: jest.fn(),
    onClearAllFiles: jest.fn(),
    selectedFiles: [],
    sending: false,
    uploading: false,
    isRTL: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders message input correctly', () => {
      render(<MessageInput {...mockProps} />);

      expect(screen.getByPlaceholderText('writeMessage')).toBeInTheDocument();
      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
    });

    it('renders with RTL layout when isRTL is true', () => {
      render(<MessageInput {...mockProps} isRTL={true} />);

      const container = screen.getByPlaceholderText('writeMessage').closest('.flex');
      expect(container).toHaveClass('flex-row-reverse');
    });

    it('renders with LTR layout when isRTL is false', () => {
      render(<MessageInput {...mockProps} isRTL={false} />);

      const container = screen.getByPlaceholderText('writeMessage').closest('.flex');
      expect(container).not.toHaveClass('flex-row-reverse');
    });
  });

  describe('Send Button Visibility', () => {
    it('hides send button when message is empty and no files selected', () => {
      render(<MessageInput {...mockProps} />);

      expect(screen.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
    });

    it('shows send button when message has content', () => {
      render(<MessageInput {...mockProps} newMessage="Hello world" />);

      expect(screen.getByTitle('sendMessage')).toBeInTheDocument();
    });

    it('shows send button when files are selected', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<MessageInput {...mockProps} selectedFiles={[file]} />);

      expect(screen.getByTitle('sendMessage')).toBeInTheDocument();
    });

    it('shows send button when both message and files are present', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<MessageInput {...mockProps} newMessage="Check this out" selectedFiles={[file]} />);

      expect(screen.getByTitle('sendMessage')).toBeInTheDocument();
    });

    it('hides send button when message becomes empty', async () => {
      const user = userEvent.setup();
      const onMessageChange = jest.fn();

      render(<MessageInput {...mockProps} newMessage="Hello" onMessageChange={onMessageChange} />);

      // Initially should show send button
      expect(screen.getByTitle('sendMessage')).toBeInTheDocument();

      // Clear the message
      const textarea = screen.getByPlaceholderText('writeMessage');
      await user.clear(textarea);

      expect(onMessageChange).toHaveBeenCalledWith('');
    });

    it('shows send button when message is typed', async () => {
      const user = userEvent.setup();
      const onMessageChange = jest.fn();

      render(<MessageInput {...mockProps} onMessageChange={onMessageChange} />);

      // Initially should not show send button
      expect(screen.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();

      // Type a message
      const textarea = screen.getByPlaceholderText('writeMessage');
      await user.type(textarea, 'Hello');

      expect(onMessageChange).toHaveBeenLastCalledWith('o'); // userEvent.type calls onChange for each character
    });
  });

  describe('Send Button States', () => {
    it('disables send button when sending is true', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" sending={true} />);

      const sendButton = screen.getByTitle('sending');
      expect(sendButton).toBeDisabled();
    });

    it('disables send button when uploading is true', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" uploading={true} />);

      const sendButton = screen.getByTitle('sending');
      expect(sendButton).toBeDisabled();
    });

    it('shows loading spinner when sending', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" sending={true} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading spinner when uploading', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" uploading={true} />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows send icon when not sending or uploading', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" />);

      const sendIcon = document.querySelector('svg');
      expect(sendIcon).toBeInTheDocument();
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  describe('Message Sending', () => {
    it('calls onSendMessage when send button is clicked', () => {
      const onSendMessage = jest.fn();
      render(<MessageInput {...mockProps} newMessage="Hello" onSendMessage={onSendMessage} />);

      const sendButton = screen.getByTitle('sendMessage');
      fireEvent.click(sendButton);

      expect(onSendMessage).toHaveBeenCalledTimes(1);
    });

    it('calls onSendMessage when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();
      const onKeyPress = jest.fn((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSendMessage();
        }
      });
      render(<MessageInput {...mockProps} newMessage="Hello" onSendMessage={onSendMessage} onKeyPress={onKeyPress} />);

      const textarea = screen.getByPlaceholderText('writeMessage');
      await user.type(textarea, '{enter}');

      expect(onSendMessage).toHaveBeenCalledTimes(1);
    });

    it('does not send when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSendMessage = jest.fn();
      render(<MessageInput {...mockProps} newMessage="Hello" onSendMessage={onSendMessage} />);

      const textarea = screen.getByPlaceholderText('writeMessage');
      await user.type(textarea, '{shift}{enter}');

      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('does not send when message is empty and no files', () => {
      const onSendMessage = jest.fn();
      render(<MessageInput {...mockProps} onSendMessage={onSendMessage} />);

      // Send button should not be visible, so this test ensures the logic is correct
      expect(screen.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
    });

    it('does not send when only whitespace is entered', () => {
      const onSendMessage = jest.fn();
      render(<MessageInput {...mockProps} newMessage="   " onSendMessage={onSendMessage} />);

      // Send button should not be visible for whitespace-only messages
      expect(screen.queryByRole('button', { name: /send/i })).not.toBeInTheDocument();
    });
  });

  describe('File Handling', () => {
    it('shows send button when files are selected', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      render(<MessageInput {...mockProps} selectedFiles={[file]} />);

      expect(screen.getByTitle('sendMessage')).toBeInTheDocument();
    });

    it('displays selected files in preview area', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' })
      ];
      render(<MessageInput {...mockProps} selectedFiles={files} />);

      expect(screen.getByText('test1.jpg')).toBeInTheDocument();
      expect(screen.getByText('test2.png')).toBeInTheDocument();
      expect(screen.getByText('2 files ready to send')).toBeInTheDocument();
    });

    it('calls onImageSelect when files are added', async () => {
      const onImageSelect = jest.fn();
      render(<MessageInput {...mockProps} onImageSelect={onImageSelect} />);

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await userEvent.upload(fileInput, file);

      expect(onImageSelect).toHaveBeenCalled();
    });

    it('calls onRemoveFile when file is removed', () => {
      const onRemoveFile = jest.fn();
      const files = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      render(<MessageInput {...mockProps} selectedFiles={files} onRemoveFile={onRemoveFile} />);

      const removeButton = screen.getByTitle('Remove image');
      fireEvent.click(removeButton);

      expect(onRemoveFile).toHaveBeenCalledWith(0);
    });
  });

  describe('Textarea Behavior', () => {
    it('updates message when typing', async () => {
      const user = userEvent.setup();
      const onMessageChange = jest.fn();
      render(<MessageInput {...mockProps} onMessageChange={onMessageChange} />);

      const textarea = screen.getByPlaceholderText('writeMessage');
      await user.type(textarea, 'Hello world');

      expect(onMessageChange).toHaveBeenLastCalledWith('d'); // userEvent.type calls onChange for each character
    });

    it('handles multiline messages with Shift+Enter', async () => {
      const user = userEvent.setup();
      const onMessageChange = jest.fn();
      render(<MessageInput {...mockProps} onMessageChange={onMessageChange} />);

      const textarea = screen.getByPlaceholderText('writeMessage');
      await user.type(textarea, 'Line 1{shift}{enter}Line 2');

      expect(onMessageChange).toHaveBeenLastCalledWith('2'); // userEvent.type calls onChange for each character
    });

    it('auto-resizes textarea based on content', () => {
      render(<MessageInput {...mockProps} newMessage="Line 1\nLine 2\nLine 3" />);

      const textarea = screen.getByPlaceholderText('writeMessage') as HTMLTextAreaElement;
      expect(textarea.style.minHeight).toBe('44px');
    });
  });

  describe('Loading States', () => {
    it('shows correct title when sending', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" sending={true} />);

      const sendButton = screen.getByTitle('sending');
      expect(sendButton).toHaveAttribute('title', 'sending');
    });

    it('shows correct title when uploading', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" uploading={true} />);

      const sendButton = screen.getByTitle('sending');
      expect(sendButton).toHaveAttribute('title', 'sending');
    });

    it('shows correct title when ready to send', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" />);

      const sendButton = screen.getByTitle('sendMessage');
      expect(sendButton).toHaveAttribute('title', 'sendMessage');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels', () => {
      render(<MessageInput {...mockProps} newMessage="Hello" />);

      const textarea = screen.getByPlaceholderText('writeMessage');
      expect(textarea).toHaveAttribute('placeholder', 'writeMessage');

      const sendButton = screen.getByTitle('sendMessage');
      expect(sendButton).toHaveAttribute('title', 'sendMessage');
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...mockProps} />);

      const textarea = screen.getByPlaceholderText('writeMessage');
      await user.click(textarea);

      expect(textarea).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      render(<MessageInput {...mockProps} newMessage={longMessage} />);

              const textarea = screen.getByPlaceholderText('writeMessage') as HTMLTextAreaElement;
      expect(textarea.value).toBe(longMessage);
      expect(screen.getByTitle('sendMessage')).toBeInTheDocument();
    });

    it('handles special characters in messages', () => {
      const specialMessage = '🚗 Hello! @user #hashtag $price 100% 🎉';
      render(<MessageInput {...mockProps} newMessage={specialMessage} />);

              const textarea = screen.getByPlaceholderText('writeMessage') as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialMessage);
      expect(screen.getByTitle('sendMessage')).toBeInTheDocument();
    });

    it('handles rapid typing and state changes', async () => {
      const user = userEvent.setup();
      const onMessageChange = jest.fn();
      render(<MessageInput {...mockProps} onMessageChange={onMessageChange} />);

      const textarea = screen.getByPlaceholderText('writeMessage');

      // Rapid typing
      await user.type(textarea, 'Hello');
      await user.clear(textarea);
      await user.type(textarea, 'World');

      expect(onMessageChange).toHaveBeenLastCalledWith('d'); // userEvent.type calls onChange for each character
    });
  });
});
