import React from 'react';
import { render, screen } from '@testing-library/react';
import VideoUpload from '@/components/listings/steps/step3-components/VideoUpload';

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? '' })
}));

jest.mock('@/utils/direction', () => ({ useDirection: () => ({ isRTL: false }) }));

describe('VideoUpload', () => {
  it('renders preview section when video present', () => {
    const file = new File(['vid'], 'video.mp4', { type: 'video/mp4' });
    render(
      <VideoUpload
        formData={{ videos: [file] } as any}
        formErrors={{}}
        videoPreviewUrls={['blob:vid']}
        handleVideoUpload={jest.fn()}
        removeVideo={jest.fn()}
      />
    );
    expect(screen.getByText(/Video Preview/i)).toBeInTheDocument();
  });
});
