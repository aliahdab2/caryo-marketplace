# Translation Patterns for Delete Confirmations

## Standard Delete Translation Keys

Each domain should follow this pattern:

### Required Keys:
```json
{
  "confirmDelete": "Are you sure you want to delete this {item}?",
  "confirmBulkDelete": "Are you sure you want to delete the selected {items}?",
  "confirmDeleteMessage": "This action cannot be undone.",
  "confirmBulkDeleteMessage": "This action cannot be undone.",
  "deleteSuccess": "{Item} deleted successfully",
  "bulkDeleteSuccess": "{Items} deleted successfully",
  "deleteError": "Failed to delete {item}. Please try again."
}
```

### Domain Examples:

#### Listings Domain (listings.json):
```json
{
  "confirmDelete": "Are you sure you want to delete this listing?",
  "confirmBulkDelete": "Are you sure you want to delete the selected listings?",
  "deleteSuccess": "Listing deleted successfully",
  "bulkDeleteSuccess": "Listings deleted successfully",
  "deleteError": "Failed to delete listing. Please try again."
}
```

#### Search Alerts Domain (search.json):
```json
{
  "confirmDeleteAlert": "Are you sure you want to delete this alert?",
  "confirmDeleteTitle": "Delete Alert?",
  "confirmDeleteMessage": "Are you sure you want to delete the alert",
  "deleteSuccess": "Alert deleted successfully",
  "deleteError": "Failed to delete alert. Please try again."
}
```

## Usage in Hook:
```typescript
// Automatically uses the correct namespace
useDeleteConfirmation({ 
  namespace: 'listings' // or 'search', 'favorites', etc.
})
```

## Benefits:
1. **Context-Specific**: Each domain has appropriate wording
2. **Maintainable**: Feature teams own their translations
3. **Flexible**: Hook works with any namespace
4. **Scalable**: Easy to add new domains
