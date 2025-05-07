package com.autotrader.autotraderbackend.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CarListingTest {

    private CarListing carListing;

    @BeforeEach
    void setUp() {
        carListing = new CarListing();
    }

    @Test
    void getPrimaryMedia_WhenPrimaryImageExists_ShouldReturnPrimaryImage() {
        // Arrange
        ListingMedia image1 = new ListingMedia();
        image1.setFileKey("image1.jpg");
        image1.setMediaType("image");
        image1.setIsPrimary(false);
        carListing.addMedia(image1);

        ListingMedia primaryImage = new ListingMedia();
        primaryImage.setFileKey("primary.jpg");
        primaryImage.setMediaType("image");
        primaryImage.setIsPrimary(true);
        carListing.addMedia(primaryImage);

        ListingMedia video1 = new ListingMedia();
        video1.setFileKey("video1.mp4");
        video1.setMediaType("video");
        video1.setIsPrimary(false); // Videos cannot be primary display image
        carListing.addMedia(video1);

        // Act
        ListingMedia result = carListing.getPrimaryMedia();

        // Assert
        assertNotNull(result);
        assertEquals("primary.jpg", result.getFileKey());
        assertTrue(result.getIsPrimary());
    }

    @Test
    void getPrimaryMedia_WhenVideoIsMarkedPrimary_ShouldReturnFirstImage() {
        // Arrange
        ListingMedia videoPrimary = new ListingMedia();
        videoPrimary.setFileKey("video_primary.mp4");
        videoPrimary.setMediaType("video");
        videoPrimary.setIsPrimary(true); // This should be ignored for primary image logic
        carListing.addMedia(videoPrimary);

        ListingMedia image1 = new ListingMedia();
        image1.setFileKey("image1.jpg");
        image1.setMediaType("image");
        image1.setIsPrimary(false);
        carListing.addMedia(image1);
        
        ListingMedia image2 = new ListingMedia();
        image2.setFileKey("image2.jpg");
        image2.setMediaType("image");
        image2.setIsPrimary(false);
        carListing.addMedia(image2);


        // Act
        ListingMedia result = carListing.getPrimaryMedia();

        // Assert
        assertNotNull(result);
        assertEquals("image1.jpg", result.getFileKey(), "Should return the first image when a video is incorrectly marked primary");
    }
    
    @Test
    void getPrimaryMedia_WhenNoPrimaryImageSet_ShouldReturnFirstImage() {
        // Arrange
        ListingMedia image1 = new ListingMedia();
        image1.setFileKey("image1.jpg");
        image1.setMediaType("image");
        image1.setIsPrimary(false);
        carListing.addMedia(image1);

        ListingMedia image2 = new ListingMedia();
        image2.setFileKey("image2.jpg");
        image2.setMediaType("image");
        image2.setIsPrimary(false);
        carListing.addMedia(image2);
        
        ListingMedia video1 = new ListingMedia();
        video1.setFileKey("video1.mp4");
        video1.setMediaType("video");
        video1.setIsPrimary(false);
        carListing.addMedia(video1);

        // Act
        ListingMedia result = carListing.getPrimaryMedia();

        // Assert
        assertNotNull(result);
        assertEquals("image1.jpg", result.getFileKey());
    }

    @Test
    void getPrimaryMedia_WhenOnlyVideosExist_ShouldReturnNull() {
        // Arrange
        ListingMedia video1 = new ListingMedia();
        video1.setFileKey("video1.mp4");
        video1.setMediaType("video");
        video1.setIsPrimary(false);
        carListing.addMedia(video1);

        ListingMedia video2 = new ListingMedia();
        video2.setFileKey("video2.mp4");
        video2.setMediaType("video");
        video2.setIsPrimary(true); // Still shouldn't be chosen as primary *image*
        carListing.addMedia(video2);

        // Act
        ListingMedia result = carListing.getPrimaryMedia();

        // Assert
        assertNull(result);
    }

    @Test
    void getPrimaryMedia_WhenNoMedia_ShouldReturnNull() {
        // Act
        ListingMedia result = carListing.getPrimaryMedia();

        // Assert
        assertNull(result);
    }
    
    @Test
    void getPrimaryMedia_WhenPrimaryImageIsAlsoFirstImage_ShouldReturnPrimaryImage() {
        // Arrange
        ListingMedia primaryImage = new ListingMedia();
        primaryImage.setFileKey("primary_first.jpg");
        primaryImage.setMediaType("image");
        primaryImage.setIsPrimary(true);
        carListing.addMedia(primaryImage);

        ListingMedia image2 = new ListingMedia();
        image2.setFileKey("image2.jpg");
        image2.setMediaType("image");
        image2.setIsPrimary(false);
        carListing.addMedia(image2);

        // Act
        ListingMedia result = carListing.getPrimaryMedia();

        // Assert
        assertNotNull(result);
        assertEquals("primary_first.jpg", result.getFileKey());
        assertTrue(result.getIsPrimary());
    }

    @Test
    void addMedia_ShouldAddMediaToList() {
        // Arrange
        ListingMedia mediaItem = new ListingMedia();
        mediaItem.setFileKey("test.jpg");
        mediaItem.setMediaType("image");

        // Act
        carListing.addMedia(mediaItem);
        List<ListingMedia> mediaList = carListing.getMedia();

        // Assert
        assertNotNull(mediaList);
        assertEquals(1, mediaList.size());
        assertSame(mediaItem, mediaList.get(0));
    }

    @Test
    void removeMedia_ShouldRemoveMediaFromList() {
        // Arrange
        ListingMedia mediaItem1 = new ListingMedia();
        mediaItem1.setFileKey("test1.jpg");
        mediaItem1.setMediaType("image");
        carListing.addMedia(mediaItem1);

        ListingMedia mediaItem2 = new ListingMedia();
        mediaItem2.setFileKey("test2.png");
        mediaItem2.setMediaType("image");
        carListing.addMedia(mediaItem2);

        // Act
        carListing.removeMedia(mediaItem1);
        List<ListingMedia> mediaList = carListing.getMedia();

        // Assert
        assertNotNull(mediaList);
        assertEquals(1, mediaList.size());
        assertSame(mediaItem2, mediaList.get(0));
        assertFalse(mediaList.contains(mediaItem1));
    }

    @Test
    void getMedia_WhenInitialized_ShouldReturnEmptyList() {
        // Act
        List<ListingMedia> mediaList = carListing.getMedia();

        // Assert
        assertNotNull(mediaList);
        assertTrue(mediaList.isEmpty());
    }
}
