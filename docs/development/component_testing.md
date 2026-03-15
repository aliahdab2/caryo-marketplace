# Component Testing Documentation

This document describes the available test pages and testing utilities for components in the Caryo Marketplace frontend.

## Test Pages Overview

The Caryo Marketplace includes dedicated test pages for component development and testing. These pages are only accessible in development mode and provide isolated environments for testing specific components.

### 🏠 Test Hub - `/test`

**Purpose**: Main development test hub page that provides links to all component test pages.

**Location**: `frontend/src/app/test/page.tsx`

**Features**:
- Central navigation to all test pages
- Development-only access
- Clean, organized layout
- Quick access to component testing

**Usage**:
```bash
# Navigate to test hub
http://localhost:3000/test
```

### 🖼️ Image Gallery Test - `/test/gallery`

**Purpose**: Dedicated test page for the `CarMediaGallery` component with various scenarios and controls.

**Location**: `frontend/src/app/test/gallery/page.tsx`

**Features**:
- **Multiple Test Scenarios**:
  - Single Image
  - Multiple Images (2-5 images)
  - Mixed Media (images + videos)
  - YouTube video integration
  - External image sources (Unsplash, Picsum)

- **Interactive Controls**:
  - Scenario selection dropdown
  - Initial index control
  - Refresh/reset functionality
  - Debug information display

- **Testing Capabilities**:
  - Navigation arrows testing
  - Modal/lightbox functionality
  - Keyboard navigation (←/→ arrows, ESC)
  - Touch/swipe gestures (mobile)
  - Video playback testing
  - Thumbnail navigation
  - Media counter display
  - RTL/LTR support

**Test Scenarios Available**:

| Scenario | Description | Media Count |
|----------|-------------|-------------|
| Single Image | Tests single image display | 1 image |
| Two Images | Tests basic navigation | 2 images |
| Multiple Images | Tests full gallery features | 5 images |
| Mixed Media | Tests images + video together | 4 images + 1 video |
| YouTube Video | Tests YouTube integration | 1 video |

**Usage**:
```bash
# Navigate to gallery test page
http://localhost:3000/test/gallery

# Test different scenarios:
1. Select scenario from dropdown
2. Set initial index (optional)
3. Click "Refresh Gallery" to apply changes
4. Test navigation, modal, keyboard shortcuts
```

**Testing Instructions**:

**Desktop Testing**:
- Click images to open modal
- Use arrow keys for navigation (←/→)
- Use arrow buttons to navigate
- Press ESC to close modal
- Click video thumbnails to play

**Mobile Testing**:
- Swipe left/right to navigate
- Tap images to open modal
- Test touch gestures
- Verify responsive layout
- Tap video thumbnails to play

## Component Information

### CarMediaGallery Component

**Location**: `frontend/src/components/CarMediaGallery/CarMediaGallery.tsx`

**Props**:
```typescript
interface CarMediaGalleryProps {
  media: CarMedia[];           // Array of images and videos
  initialIndex?: number;       // Starting media index (default: 0)
  className?: string;          // Additional CSS classes
}
```

**Media Type**:
```typescript
interface CarMedia {
  type: 'image' | 'video';
  url: string;
  alt: string;
  thumbnailUrl?: string;       // For videos
}
```

**Features**:
- Caryo-style navigation arrows
- Media counter (1/5 format)
- Modal/lightbox view
- Keyboard navigation
- Touch/swipe support
- RTL/LTR language support
- Video integration (YouTube)
- Responsive design
- Accessibility support

## Development Guidelines

### Adding New Test Pages

1. Create page in `/test/[pagename]/page.tsx`
2. Add link to test hub (`/test/page.tsx`)
3. Document the test page in this file
4. Ensure development-only access

### Test Data Management

- Keep test data in the test page files
- Use realistic, working URLs for images/videos
- Include various scenarios (edge cases, different sizes)
- Test with both internal and external media sources

### Best Practices

- **Focus on Component**: Test pages should isolate specific components
- **Multiple Scenarios**: Include various use cases and edge cases
- **Debug Information**: Show relevant debug info for developers
- **Interactive Controls**: Allow easy switching between test scenarios
- **Documentation**: Keep this documentation updated with new test pages

## External Dependencies

### Image Sources Used in Tests
- **Unsplash**: High-quality car images (`images.unsplash.com`)
- **Picsum Photos**: Placeholder images (`picsum.photos`)

### Next.js Configuration
Test pages require external image domains in `next.config.ts`:
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
    {
      protocol: 'https',
      hostname: 'picsum.photos',
    },
  ],
}
```

## Troubleshooting

### Common Issues

1. **Images not loading**: Check `next.config.ts` remote patterns
2. **404 errors**: Verify image URLs are still valid
3. **Modal not working**: Check for JavaScript errors in console
4. **Touch gestures not working**: Test on actual mobile device

### Debug Information

The gallery test page includes debug information showing:
- Total media count
- Images vs videos count
- Current scenario
- Initial index setting

## Future Enhancements

Potential improvements for test pages:
- [ ] Performance testing tools
- [ ] Accessibility testing helpers
- [ ] Visual regression testing
- [ ] Component prop validation
- [ ] Error boundary testing
- [ ] Load testing with many images

---

## Quick Links

- **Test Hub**: [http://localhost:3000/test](http://localhost:3000/test)
- **Gallery Test**: [http://localhost:3000/test/gallery](http://localhost:3000/test/gallery)
- **CarMediaGallery Component**: `frontend/src/components/CarMediaGallery/`
- **Component Documentation**: `frontend/src/components/CarMediaGallery/README.md`

---

*Last updated: January 2025*
*For questions or issues, contact the development team.*
