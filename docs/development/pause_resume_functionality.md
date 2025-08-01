# Listing Pause and Resume Functionality

## Overview
The pause and resume functionality allows sellers to temporarily hide their listings from the marketplace without fully archiving or deleting them. This is useful when a seller wants to temporarily remove a listing, for example, if they're entertaining an offer but haven't completed the sale yet.

## Implementation Details

### Listing Statuses
The listing status flow now includes `PAUSED` status in addition to the existing statuses:

```
PENDING_APPROVAL → ACTIVE → PAUSED/EXPIRED/ARCHIVED/SOLD
                     ↑           ↓
                     └───────────┘
```

### Database Changes
- Added `PAUSED` enum value to the `ListingStatus` enum
- Added `pausedAt` timestamp field to the `CarListing` entity
- Added `lastActiveAt` timestamp field to track when the listing was last active

### API Endpoints

#### Pause a Listing
```
PUT /api/v1/listings/{id}/pause
```
- **Authorization**: Requires listing owner or admin access
- **Description**: Sets the listing status to `PAUSED` and records the current timestamp
- **Returns**: 200 OK with updated listing data

#### Resume a Listing
```
PUT /api/v1/listings/{id}/resume
```
- **Authorization**: Requires listing owner or admin access
- **Description**: Sets the listing status back to `ACTIVE`, clears the `pausedAt` field, and updates `lastActiveAt`
- **Returns**: 200 OK with updated listing data

### Business Rules

1. **Visibility**: Paused listings are not shown in search results or browsing interfaces
2. **Duration**: Listings can remain paused for up to 30 days before they're automatically expired
3. **Limits**: Each listing can be paused and resumed up to 5 times during its lifecycle
4. **Expiration**: The listing's expiration date is extended by the duration it was paused
5. **Analytics**: Time spent in paused state doesn't count toward "days on market" metrics

### Transaction Management

All pause and resume operations are wrapped in transactions to ensure data consistency. When a listing is paused or resumed, the following operations occur in a single transaction:

1. Status update in the database
2. Timestamp updates
3. Event publishing for notifications
4. Search index updates

### Async Event Handling

When a listing is paused or resumed, events are fired:

- `ListingPausedEvent`: Triggered when a listing is paused
- `ListingResumedEvent`: Triggered when a listing is resumed

These events are handled asynchronously with proper transaction management to ensure that all database operations are ACID compliant and to prevent detached entity exceptions.

## User Experience

### Seller Perspective
- Sellers see a "Pause Listing" button on their active listings
- Paused listings are shown in a separate tab in the seller dashboard
- Clear indication of how long a listing has been paused and when it will expire
- "Resume Listing" button to make the listing active again

### Buyer Perspective
- Paused listings do not appear in search results or browsing
- If a buyer has saved/favorited a paused listing, it appears with a "Temporarily Unavailable" indicator
- Buyers cannot contact sellers about paused listings

## Testing Considerations

1. **Unit Tests**: Verify business logic for pausing/resuming
2. **Integration Tests**: Ensure proper database state transitions
3. **Performance Tests**: Check that large numbers of state changes don't impact system performance
4. **Concurrency Tests**: Verify correct behavior when multiple operations happen simultaneously

## Monitoring

- Monitor the ratio of paused listings to active listings
- Track frequency of pause/resume actions per listing
- Alert if a high percentage of listings are being paused (could indicate a market issue)

## Future Enhancements

1. Allow sellers to schedule automatic resuming at a specific date/time
2. Provide analytics on how pausing affects listing performance
3. Implement smart suggestions for when to pause/resume based on market activity
