# Video Implementation Guide - Following AutoTrader UK Best Practices

## Overview

The Caryo Marketplace backend now supports video content for car listings, following AutoTrader UK's implementation patterns and best practices. This implementation supports both uploaded video files and external video URLs (YouTube, Vimeo) with proper validation and constraints.

## Key Features

### 🎯 **AutoTrader-Inspired Implementation**
- **Primary Method**: External video URLs (YouTube, Vimeo)
- **Secondary Method**: Direct video file uploads
- **Video Limits**: 1 uploaded video + 1 external video URL per listing
- **Duration Limit**: 3 minutes (180 seconds) maximum
- **File Size Limit**: 100MB maximum for uploads

### 📊 **Supported Video Formats**
Following AutoTrader's supported formats:
- MP4 (`video/mp4`)
- QuickTime (`video/quicktime`)
- AVI (`video/x-msvideo`)
- WebM (`video/webm`)
- Windows Media (`video/x-ms-wmv`)
- Flash Video (`video/x-flv`)
- MPEG (`video/mpeg`)
- 3GPP (`video/3gpp`)

## Database Schema

### Updated `listing_media` Table
```sql
-- New fields added for video support
ALTER TABLE listing_media ADD COLUMN external_url VARCHAR(500);
ALTER TABLE listing_media ADD COLUMN video_source VARCHAR(20);
ALTER TABLE listing_media ADD COLUMN duration_seconds INTEGER;

-- Updated constraints
ALTER TABLE listing_media ALTER COLUMN file_key DROP NOT NULL;
ALTER TABLE listing_media ALTER COLUMN file_name DROP NOT NULL;
ALTER TABLE listing_media ALTER COLUMN content_type DROP NOT NULL;
ALTER TABLE listing_media ALTER COLUMN size DROP NOT NULL;
```

### Video Source Types
- `upload`: Direct video file upload
- `youtube`: YouTube video URL
- `vimeo`: Vimeo video URL
- `external`: Other external video URLs

## API Endpoints

### 1. Upload Video File
```http
POST /api/files/upload
Content-Type: multipart/form-data

Parameters:
- file: Video file (max 100MB, 3 minutes)
- listingId: Car listing ID
```

**Response:**
```json
{
  "url": "https://storage.url/listings/123/video.mp4",
  "key": "listings/123/abc123-uuid.mp4"
}
```

### 2. Add External Video URL
```http
POST /api/listings/{listingId}/videos/external
Content-Type: application/json
Authorization: Bearer {token}

{
  "url": "https://youtube.com/watch?v=abc123",
  "title": "Car Tour Video",
  "durationSeconds": 120
}
```

**Response:**
```json
{
  "id": 456,
  "url": "https://youtube.com/watch?v=abc123",
  "videoSource": "youtube",
  "mediaType": "video",
  "sortOrder": 1,
  "isPrimary": false
}
```

### 3. Remove External Video
```http
DELETE /api/listings/{listingId}/videos/external/{mediaId}
Authorization: Bearer {token}
```

## Business Logic & Validation

### Video Limits per Listing
- ✅ Maximum 1 uploaded video file
- ✅ Maximum 1 external video URL
- ✅ Total videos ≤ 2 per listing

### File Upload Validation
- ✅ File size ≤ 100MB
- ✅ Content type in allowed list
- ✅ Duration ≤ 180 seconds (when provided)

### URL Validation
- ✅ YouTube URL format validation
- ✅ Vimeo URL format validation
- ✅ HTTPS requirement for external URLs

## Updated Response Schema

### CarListingResponse with Videos
```json
{
  "id": 123,
  "title": "2023 Toyota Camry",
  "media": [
    {
      "id": 1,
      "url": "https://storage.url/listings/123/main.jpg",
      "mediaType": "image",
      "sortOrder": 0,
      "isPrimary": true
    },
    {
      "id": 2,
      "url": "https://storage.url/listings/123/video.mp4",
      "mediaType": "video",
      "videoSource": "upload",
      "durationSeconds": 90,
      "sortOrder": 1,
      "isPrimary": false
    },
    {
      "id": 3,
      "url": "https://youtube.com/watch?v=abc123",
      "mediaType": "video",
      "videoSource": "youtube",
      "externalUrl": "https://youtube.com/watch?v=abc123",
      "durationSeconds": 120,
      "sortOrder": 2,
      "isPrimary": false
    }
  ]
}
```

## Configuration

### Video Feature Control

The system allows granular control over video features through configuration properties:

- **`app.upload.video-upload-enabled`**: Controls whether users can upload video files directly
  - `true`: Enable video file uploads (default: `false`)
  - `false`: Disable video file uploads, users will see a disabled upload area
  
- **`app.upload.video-url-enabled`**: Controls whether users can add external video URLs
  - `true`: Enable external video URLs (default: `true`)
  - `false`: Disable external video URL input

### Use Cases

1. **URLs Only (Current Configuration)**: 
   - `video-upload-enabled=false` + `video-url-enabled=true`
   - Users can only add YouTube/Vimeo URLs, no file uploads
   - Reduces server storage and bandwidth costs
   - Follows AutoTrader UK's primary pattern

2. **Full Video Support**: 
   - `video-upload-enabled=true` + `video-url-enabled=true`
   - Users can both upload videos and add external URLs
   - Maximum flexibility for users

3. **No Video Support**: 
   - `video-upload-enabled=false` + `video-url-enabled=false`
   - Completely disables video functionality
   - Video section won't appear in the listing form

### Application Properties
```properties
# Video Configuration (Following AutoTrader best practices)
app.upload.video-upload-enabled=false
app.upload.video-url-enabled=true
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
app.upload.max-video-size=104857600
app.upload.max-video-duration=180
app.upload.max-videos-per-listing=1
app.upload.max-external-videos-per-listing=1

# Allowed Media Types
app.upload.allowed-types=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-ms-wmv,video/x-flv,video/mpeg,video/3gpp
```

## Usage Examples

### Frontend Integration
```javascript
// Upload video file
const uploadVideo = async (listingId, videoFile) => {
  const formData = new FormData();
  formData.append('file', videoFile);
  formData.append('listingId', listingId);
  
  const response = await fetch('/api/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};

// Add YouTube video
const addYouTubeVideo = async (listingId, youtubeUrl) => {
  const response = await fetch(`/api/listings/${listingId}/videos/external`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      url: youtubeUrl,
      title: 'Car Showcase Video'
    })
  });
  
  return response.json();
};
```

## Error Handling

### Common Error Responses
```json
// Video limit exceeded
{
  "error": "Maximum 1 uploaded video per listing allowed. Following AutoTrader best practices."
}

// Invalid file size
{
  "error": "Video file size exceeds maximum limit of 100MB"
}

// Invalid YouTube URL
{
  "error": "Invalid YouTube URL format"
}

// Duration exceeded
{
  "error": "Video duration cannot exceed 3 minutes (180 seconds)"
}
```

## Testing

### Manual Testing
1. **Upload Video**: Test with various video formats and sizes
2. **YouTube Integration**: Test with different YouTube URL formats
3. **Validation**: Test file size, duration, and format limits
4. **Business Logic**: Verify 1+1 video limit enforcement

### Test Data
```bash
# Valid YouTube URLs for testing
https://youtube.com/watch?v=abc123
https://www.youtube.com/watch?v=abc123
https://youtu.be/abc123

# Valid Vimeo URLs for testing
https://vimeo.com/123456789
https://www.vimeo.com/123456789
```

## Migration Guide

### Database Migration
1. Run migration: `V2__Add_Video_Support.sql`
2. Verify new columns exist
3. Test constraints are working

### Existing Data
- All existing media remains unchanged
- New video fields are nullable for backward compatibility
- No data migration required

## Best Practices

### Video Content Guidelines (From AutoTrader)
- ✅ Use consistent locations for all videos
- ✅ Choose neutral, clutter-free backgrounds
- ✅ Ensure vehicle is clean inside and out
- ✅ Lower windows to prevent reflections
- ✅ Straighten front wheels for professional appearance
- ✅ Keep videos under 3 minutes
- ✅ Use 4:3 aspect ratio for optimal display

### Technical Best Practices
- ✅ Always validate video URLs before storing
- ✅ Implement proper error handling for video processing
- ✅ Use signed URLs for uploaded video files
- ✅ Log video operations for debugging
- ✅ Respect video platform rate limits

## Monitoring & Analytics

### Key Metrics to Track
- Video upload success/failure rates
- Most popular video sources (upload vs YouTube vs Vimeo)
- Average video duration
- Video engagement metrics (if implemented in frontend)

### Logging
All video operations are logged with appropriate levels:
- INFO: Successful operations
- WARN: Validation failures
- ERROR: System errors during processing

---

**Implementation Status**: ✅ Complete - Ready for Testing
**AutoTrader Compliance**: ✅ Follows UK AutoTrader patterns and limits
**Version**: 1.0 - Initial Implementation
