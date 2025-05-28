# CarMediaGallery Component

A Blocket-inspired responsive gallery component for displaying car images and videos with modal view support for CarYo Marketplace.

## Features

- ✅ One Media at a Time: Show only one image or video at a time in both compact and full-screen modes.
- ✅ Navigation Arrows: Left/right arrows for navigating media items (desktop + mobile).
- ✅ Image & Video Support: Mix car images and 1 optional video.
- ✅ Modal View: Full-screen gallery opens on click.
- ✅ Keyboard Support: Navigate with ← / → arrows; close with Esc.
- ✅ Touch & Drag Support: Swipe on mobile (via keen-slider).
- ✅ Responsive & Accessible: Mobile-first and ARIA-compliant.

## Usage

```tsx
import { CarMediaGallery } from '@/components/CarMediaGallery';

// Example media array
const carMedia = [
  { 
    type: 'image', 
    url: '/images/car-front.jpg',
    alt: '2023 Toyota Camry front view'
  },
  { 
    type: 'image', 
    url: '/images/car-interior.jpg',
    alt: 'Interior dashboard view'
  },
  { 
    type: 'image', 
    url: '/images/car-back.jpg',
    alt: 'Rear view showing trunk space'
  },
  { 
    type: 'video', 
    url: 'https://www.youtube.com/watch?v=abc123', 
    thumbnailUrl: '/images/video-thumbnail.jpg',
    alt: 'Car walk-around video'
  }
];

// In your component
function CarDetailPage() {
  return (
    <div className="car-detail-page">
      <CarMediaGallery 
        media={carMedia} 
        initialIndex={0}
        showThumbnails={true}
      />
      {/* Rest of your car details */}
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `media` | `CarMedia[]` | Yes | Array of media objects (images first, optional video last) |
| `initialIndex` | `number` | No | Index of the image to show first (default: 0) |
| `showThumbnails` | `boolean` | No | Whether to show thumbnail navigation (default: true) |
| `enableSwipe` | `boolean` | No | Enable swipe gestures on touch devices (default: true) |
| `className` | `string` | No | Additional CSS class for styling |

### CarMedia Type

```ts
type CarMedia = {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string; // Required for video
  alt: string; // For accessibility
};
```

## Technical Details

- Uses React Hooks for state management
- Optimized with Next.js Image component
- Responsive design with Tailwind CSS
- Modal implementation with @headlessui/react
- Touch gesture handling with keen-slider
- Smart video detection for MP4 vs YouTube embeds
- Lazy loading for improved performance
- Limited to 10 images and 1 video maximum
- Accessible with keyboard navigation and proper ARIA attributes

## Swipe Functionality with keen-slider

This component uses [keen-slider](https://keen-slider.io/) for smooth touch and swipe interactions:

- Native-feeling touch/swipe gestures on mobile devices
- Works in both the main gallery view and full-screen modal
- Configurable sensitivity and resistance
- Drag functionality for desktop users (click and drag)
- Built-in animation effects for smooth transitions

The implementation handles edge cases:
- Proper boundary behavior (resistance at the start/end)
- Works with both images and video content
- Touch/swipe events don't interfere with video controls

## Dependencies

```bash
# Install required dependencies
npm install @headlessui/react @heroicons/react keen-slider
# or with yarn
yarn add @headlessui/react @heroicons/react keen-slider
```

## Swipe Navigation

The gallery implements Blocket-style swipe navigation:

- Shows a single main image at a time with navigation controls
- Swipe left/right on mobile to navigate between images
- Works in both main gallery view and fullscreen modal
- Visual indicators (dots or thumbnails) show current position
- Smooth transition animations between images
- Requires installing `react-swipeable` for touch handling:
  ```bash
  npm install react-swipeable
  # or
  yarn add react-swipeable
  ```

## Design Principles (Blocket-inspired)

- Clean, minimal UI with focus on the content
- Rounded thumbnails with subtle shadow effects
- Clear visual indicators for active/selected media
- High-contrast play button overlay for video thumbnails
- Smooth transitions between images in modal view
- Intuitive swipe gestures on both main gallery and fullscreen mode
