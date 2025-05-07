# Multiple Media Implementation

## Overview

The Autotrader application supports multiple media items (images and videos) per car listing. This is implemented through the `listing_media` table and corresponding entity classes, allowing sellers to add multiple images and videos to their listings with proper sorting order and primary media identification.

## Implementation Details

### Database Structure
- **CarListing Entity**: Contains a one-to-many relationship with ListingMedia
- **ListingMedia Entity**: Represents a single media item (image or video) associated with a car listing 

### Key Features
1. **Multiple Media Support**: Each car listing can have multiple media items (images, videos)
2. **Sorting Order**: Media items are sorted by their `sortOrder` property 
3. **Primary Media Identification**: One media item can be marked as primary (`isPrimary = true`)
4. **Media Types**: Support for different types of media (currently 'image' and 'video')

### Technical Implementation

The `CarListingMapper.java` class handles the mapping of multiple media items to DTOs:

1. **Media Mapping Process**:
   - `mapListingMedia()`: Maps all media items from a car listing to ListingMediaResponse DTOs
   - `mapSingleMedia()`: Maps a single media item to a ListingMediaResponse DTO
   - Both methods call `generateSignedUrl()` to generate signed URLs for each media item

2. **URL Generation Optimization**:
   - Signed URLs are generated only once per media item
   - The URL generation is centralized to avoid duplication

3. **Sorting and Default Primary**:
   - Media items are sorted based on their `sortOrder` property
   - Primary media items are identified by the `isPrimary` flag

4. **Error Handling**:
   - Graceful error handling in URL generation
   - Proper logging for debugging URL generation issues
   - Resilient behavior if storage service does not support signed URLs

### Response Schema

The `CarListingResponse` includes a `media` array with all media items:

```json
{
  "id": 1,
  "title": "2023 Toyota Camry",
  "brand": "Toyota",
  "model": "Camry",
  "modelYear": 2023,
  "price": 28500,
  "mileage": 15000,
  "description": "Excellent condition",
  "media": [
    {
      "id": 101,
      "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/main.jpg",
      "fileKey": "listings/1/main.jpg",
      "fileName": "main.jpg",
      "contentType": "image/jpeg",
      "size": 450000,
      "sortOrder": 0,
      "isPrimary": true,
      "mediaType": "image"
    },
    {
      "id": 102,
      "url": "https://your-s3-bucket.s3.amazonaws.com/listings/1/interior.jpg",
      "fileKey": "listings/1/interior.jpg",
      "fileName": "interior.jpg",
      "contentType": "image/jpeg",
      "size": 300000,
      "sortOrder": 1,
      "isPrimary": false,
      "mediaType": "image"
    }
  ],
  "approved": true,
  "sellerUsername": "testuser",
  "locationDetails": {
    // ... location details ...
  },
  "createdAt": "2025-05-01T10:00:00Z"
}
```

## How to Use

### Adding Media to a Listing

Media can be added to a listing in two ways:

1. **During Listing Creation**:
   - Use the `/api/listings/with-image` endpoint to create a listing with an initial image

2. **After Listing Creation**:
   - Use the `/api/files/upload` endpoint with a `listingId` parameter to associate media with an existing listing

### Managing Media Items

The API supports the following operations for managing media items:

1. **Upload New Media**:
   ```bash
   curl -X POST http://localhost:8080/api/files/upload \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@/path/to/your/image.jpg" \
     -F "listingId=123"
   ```

2. **Set a Media Item as Primary** (suggested endpoint):
   ```bash
   curl -X PUT http://localhost:8080/api/listings/123/media/set-primary \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"mediaFileKey": "listings/123/image.jpg"}'
   ```

3. **Reorder Media Items** (suggested endpoint):
   ```bash
   curl -X PUT http://localhost:8080/api/listings/123/media/order \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '[
           {"mediaFileKey": "listings/123/image1.jpg", "sortOrder": 0},
           {"mediaFileKey": "listings/123/image2.jpg", "sortOrder": 1}
         ]'
   ```

4. **Delete Media**:
   ```bash
   curl -X DELETE http://localhost:8080/api/files/listings/123/image.jpg \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Development Notes

1. Media items are automatically sorted by `sortOrder` when returned in responses
2. When adding new media, if no `isPrimary` flag is explicitly set and no primary media item exists yet, the first uploaded media item will be automatically set as primary
3. The system handles error conditions gracefully, including storage service issues
4. URLs for media have configurable expiration times (default: 1 hour)

## Testing

Comprehensive tests are included in `CarListingMapperTest` to validate the implementation, covering:

1. Happy path scenarios with single and multiple media items
2. Edge cases such as missing media or invalid file keys
3. Error handling for storage service issues

## Transition from Single Image to Multiple Media

### Deprecated Features

The following features are deprecated and will be removed in future versions:

1. **`imageUrl` field in `CreateListingRequest`**: Use the dedicated media upload endpoints instead.
2. **`getPrimaryImageUrl()` method in `CarListing`**: Use `getPrimaryMedia()` or access the full collection with `getMedia()` instead.

### Migration Guide for Developers

#### Retrieving Images

##### Before (Deprecated)
```java
// Getting the primary image URL (just the file key string)
String primaryImageKey = carListing.getPrimaryImageUrl();
if (primaryImageKey != null) {
    // Generate a signed URL or use the key as needed
    String signedUrl = storageService.getSignedUrl(primaryImageKey);
    // ...
}
```

##### Now (Recommended)
```java
// Getting the primary media object
ListingMedia primaryMedia = carListing.getPrimaryMedia();
if (primaryMedia != null) {
    // Access all media properties
    String fileKey = primaryMedia.getFileKey();
    String fileName = primaryMedia.getFileName(); 
    String contentType = primaryMedia.getContentType();
    Long size = primaryMedia.getSize();
    
    // Generate a signed URL if needed
    String signedUrl = storageService.getSignedUrl(fileKey);
    
    // You can also check if this is actually the primary media
    boolean isPrimary = primaryMedia.getIsPrimary();
}

// Retrieving all media items for a listing
List<ListingMedia> allMedia = carListing.getMedia();
for (ListingMedia media : allMedia) {
    // Process each media item
}

// Getting media sorted by sortOrder
List<ListingMedia> sortedMedia = carListing.getMedia().stream()
    .sorted(Comparator.comparing(ListingMedia::getSortOrder))
    .collect(Collectors.toList());
```

#### Using in Service Methods

##### Before (Deprecated)
```java
// In a service or controller
public String getListingImageUrl(Long listingId) {
    CarListing listing = carListingRepository.findById(listingId)
        .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));
    
    // Just getting the file key, no access to other media properties
    String imageUrl = listing.getPrimaryImageUrl();
    if (imageUrl == null) {
        return null; // No image available
    }
    
    return storageService.getSignedUrl(imageUrl);
}
```

##### Now (Recommended)
```java
// In a service or controller
public ListingMediaResponse getListingPrimaryMedia(Long listingId) {
    CarListing listing = carListingRepository.findById(listingId)
        .orElseThrow(() -> new ResourceNotFoundException("Listing", "id", listingId));
    
    // Get the full media object with all properties
    ListingMedia primaryMedia = listing.getPrimaryMedia();
    if (primaryMedia == null) {
        return null; // No media available
    }
    
    // Map to response DTO with all media information
    ListingMediaResponse response = new ListingMediaResponse();
    response.setId(primaryMedia.getId());
    response.setFileKey(primaryMedia.getFileKey());
    response.setFileName(primaryMedia.getFileName());
    response.setContentType(primaryMedia.getContentType());
    response.setSize(primaryMedia.getSize());
    response.setSortOrder(primaryMedia.getSortOrder());
    response.setIsPrimary(primaryMedia.getIsPrimary());
    response.setMediaType(primaryMedia.getMediaType());
    
    // Add signed URL if needed
    response.setUrl(storageService.getSignedUrl(primaryMedia.getFileKey()));
    
    return response;
}
```

#### Working with Image URLs in Templates

##### Before (Deprecated)
```java
// In a Thymeleaf template or similar
String imageUrl = storageService.getPublicUrl(listing.getPrimaryImageUrl());
model.addAttribute("imageUrl", imageUrl);

// Or in a REST response builder
return ResponseEntity.ok()
    .body(Map.of("imageUrl", storageService.getSignedUrl(listing.getPrimaryImageUrl())));
```

##### Now (Recommended)
```java
// Get complete media information
ListingMedia media = listing.getPrimaryMedia();
if (media != null) {
    // In a Thymeleaf template context
    model.addAttribute("media", Map.of(
        "url", storageService.getSignedUrl(media.getFileKey()),
        "fileName", media.getFileName(),
        "contentType", media.getContentType(),
        "isPrimary", media.getIsPrimary()
    ));
    
    // Or in a REST response
    Map<String, Object> mediaInfo = new HashMap<>();
    mediaInfo.put("url", storageService.getSignedUrl(media.getFileKey()));
    mediaInfo.put("fileName", media.getFileName());
    mediaInfo.put("contentType", media.getContentType());
    mediaInfo.put("size", media.getSize());
    return ResponseEntity.ok().body(mediaInfo);
}
```

#### Managing Media Items

1. **For uploading images**:
   - During listing creation: Use `/api/listings/with-image` endpoint
   - For existing listings: Use `/api/files/upload` endpoint with `listingId`

2. **For updating images**:
   - Use the media management endpoints to add, remove, or reorder media items
   - To set a primary media item: Use `/api/listings/{id}/media/set-primary`

3. **For manipulating media programmatically**:
   ```java
   // Add new media
   ListingMedia newMedia = new ListingMedia();
   newMedia.setFileKey("listings/123/new-image.jpg");
   newMedia.setFileName("new-image.jpg");
   newMedia.setContentType("image/jpeg");
   newMedia.setSize(fileSize);
   newMedia.setSortOrder(nextSortOrder);
   newMedia.setIsPrimary(false); // Not primary by default
   newMedia.setMediaType("image");
   
   carListing.addMedia(newMedia);
   
   // Set a media item as primary
   carListing.getMedia().forEach(m -> m.setIsPrimary(false)); // Clear existing primary
   newMedia.setIsPrimary(true); // Set new primary
   
   // Remove media
   ListingMedia mediaToRemove = carListing.getMedia().stream()
       .filter(m -> m.getFileKey().equals(fileKeyToRemove))
       .findFirst()
       .orElse(null);
   
   if (mediaToRemove != null) {
       carListing.removeMedia(mediaToRemove);
       // Also delete from storage if needed
       storageService.delete(mediaToRemove.getFileKey());
   }
   ```
