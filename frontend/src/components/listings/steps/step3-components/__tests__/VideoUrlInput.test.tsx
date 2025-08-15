import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoUrlInput from '@/components/listings/steps/step3-components/VideoUrlInput';

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? '' })
}));

describe('VideoUrlInput (YouTube only)', () => {
  const baseProps = {
    formData: { videoUrls: [] } as { videoUrls: Array<{ url: string; isValidated: boolean }> },
    formErrors: {},
    handleVideoUrlChange: jest.fn(),
    removeVideoUrl: jest.fn(),
    getVideoEmbedUrl: (url: string) => {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      return m ? `https://www.youtube.com/embed/${m[1]}` : null;
    }
  };

  beforeEach(() => jest.clearAllMocks());

  it('accepts a YouTube URL and calls change handler', () => {
    render(<VideoUrlInput {...baseProps} />);
    const input = screen.getByLabelText(/Enter video URL from YouTube/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=abc123' } });

    expect(baseProps.handleVideoUrlChange).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123');
  });

  it('renders an embed preview when a valid YouTube URL is present', () => {
    render(<VideoUrlInput {...baseProps} formData={{ videoUrls: [{ url: 'https://youtu.be/xyz', isValidated: true }] }} />);
    expect(screen.getByTitle(/External video preview/i)).toBeInTheDocument();
  });
});
