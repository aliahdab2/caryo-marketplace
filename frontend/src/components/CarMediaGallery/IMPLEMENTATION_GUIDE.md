# CarMediaGallery Implementation Guide

This guide will help you integrate the Blocket-inspired CarMediaGallery component into your car listing pages.

## Installation

1. First, install the required dependencies:

```bash
# Run the provided installation script
sh ./scripts/install-gallery-deps.sh

# Or install dependencies manually
npm install @headlessui/react @heroicons/react react-player react-swipeable
```

## Basic Implementation

### Step 1: Import the component

```tsx
import { CarMediaGallery } from '@/components/CarMediaGallery';
```

### Step 2: Prepare your media data

```tsx
// In your car listing component
const CarDetailPage = ({ carData }) => {
  // Transform API data into the required format
  const carMedia = [
    // Main car image
    {
      type: 'image',
      url: carData.mainImageUrl,
      alt: `${carData.year} ${carData.make} ${carData.model} - Main View`
    },
    // Additional car images
    ...carData.additionalImages.map((img, index) => ({
      type: 'image' as const,
      url: img.url,
      alt: `${carData.year} ${carData.make} ${carData.model} - View ${index + 2}`
    })),
    // Optional video (if available)
    ...(carData.videoUrl ? [{
      type: 'video' as const,
      url: carData.videoUrl,
      thumbnailUrl: carData.videoThumbnailUrl || carData.mainImageUrl,
      alt: `${carData.year} ${carData.make} ${carData.model} - Video Tour`
    }] : [])
  ];

  return (
    <div className="car-detail-container max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">{carData.title}</h1>
      
      {/* Car Media Gallery */}
      <CarMediaGallery 
        media={carMedia} 
        showThumbnails={true}
        className="mb-8"
      />
      
      {/* Rest of car details */}
      {/* ... */}
    </div>
  );
};
```

## Advanced Usage

### Custom Styling

You can add additional styling by passing a className:

```tsx
<CarMediaGallery 
  media={carMedia} 
  className="border rounded-lg shadow-lg bg-white p-4"
/>
```

### Starting with a Specific Image

Use the `initialIndex` prop to show a specific image first:

```tsx
<CarMediaGallery 
  media={carMedia} 
  initialIndex={2} // Show the third image first (0-indexed)
/>
```

### Handling Media Loading States

Add loading states for better user experience:

```tsx
import { useState, useEffect } from 'react';

const CarDetailPage = ({ carId }) => {
  const [loading, setLoading] = useState(true);
  const [carMedia, setCarMedia] = useState([]);
  
  useEffect(() => {
    const loadCarData = async () => {
      setLoading(true);
      try {
        const data = await fetchCarDetails(carId);
        
        // Transform API data to CarMedia format
        const media = [
          // Images and video formatting
          // ...
        ];
        
        setCarMedia(media);
      } catch (error) {
        console.error('Failed to load car data', error);
        // Handle error state
      } finally {
        setLoading(false);
      }
    };
    
    loadCarData();
  }, [carId]);
  
  return (
    <div>
      {loading ? (
        <div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>
      ) : (
        <CarMediaGallery media={carMedia} />
      )}
    </div>
  );
};
```

## Integration with Image Upload

When implementing image upload functionality for car listings, make sure to:

1. Validate image types (JPEG, PNG, WebP)
2. Resize images to standard dimensions for consistency
3. Generate and store thumbnails for better performance
4. Store alt text with descriptive information

Example upload handler:

```tsx
const handleImageUpload = async (files) => {
  const formData = new FormData();
  
  Array.from(files).forEach((file) => {
    formData.append('images', file);
  });
  
  try {
    const response = await fetch('/api/car-listings/upload-images', {
      method: 'POST',
      body: formData,
    });
    
    const uploadedFiles = await response.json();
    
    // Map uploaded files to CarMedia format
    const newMedia = uploadedFiles.map(file => ({
      type: 'image',
      url: file.url,
      alt: `${carData.year} ${carData.make} ${carData.model} - Additional view`
    }));
    
    // Update state with new media
    setCarMedia([...carMedia, ...newMedia]);
  } catch (error) {
    console.error('Failed to upload images', error);
  }
};
```

## Best Practices

1. **Optimize Images**: Use Next.js Image component's built-in optimization
2. **Accessibility**: Always provide descriptive alt text
3. **Responsive Design**: Test the gallery on various screen sizes
4. **Lazy Loading**: Only load thumbnails and the first image initially
5. **Error Handling**: Provide fallbacks for missing images
6. **Image Limits**: Limit to 10 images and 1 video for optimal performance
