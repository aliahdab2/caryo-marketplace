# 🚗 **Caryo Marketplace API Documentation**

## **Overview**
This document describes the REST API endpoints for the Caryo car marketplace backend service.

---

## **🔐 Authentication Endpoints**

### **POST /api/auth/signup**
Create a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

### **POST /api/auth/login**
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "type": "Bearer",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string"
  }
}
```

---

## **🚗 Car Listing Endpoints**

### **GET /api/listings**
Get paginated list of car listings with optional filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 20)
- `sort` (optional): Sort field (default: "createdAt")
- `direction` (optional): Sort direction (default: "DESC")

**Response:**
```json
{
  "content": [
    {
      "id": "number",
      "title": "string",
      "modelYear": "number",
      "mileage": "number",
      "price": "number",
      "currency": "string",
      "description": "string",
      "createdAt": "string"
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "currentPage": "number"
}
```

### **POST /api/listings**
Create a new car listing.

**Request Body:**
```json
{
  "title": "string",
  "modelId": "number",
  "modelYear": "number",
  "mileage": "number",
  "price": "number",
  "currency": "string",
  "locationId": "number",
  "description": "string"
}
```

**Response:**
```json
{
  "id": "number",
  "title": "string",
  "message": "Listing created successfully"
}
```

### **GET /api/listings/{id}**
Get a specific car listing by ID.

**Response:**
```json
{
  "id": "number",
  "title": "string",
  "modelYear": "number",
  "mileage": "number",
  "price": "number",
  "currency": "string",
  "description": "string",
  "brand": {
    "id": "number",
    "displayNameEn": "string",
    "displayNameAr": "string"
  },
  "model": {
    "id": "number",
    "displayNameEn": "string",
    "displayNameAr": "string"
  },
  "location": {
    "id": "number",
    "displayNameEn": "string",
    "displayNameAr": "string"
  },
  "createdAt": "string"
}
```

---

## **💬 Messaging System Endpoints**

### **POST /api/conversations**
Start a new conversation about a car listing.

**Request Body:**
```json
{
  "listingId": "number",
  "initialMessage": "string",
  "subject": "string (optional)",
  "messageType": "string (optional, default: 'text')",
  "attachmentIds": ["number"] (optional)
}
```

**Validation Groups:**
- `CreateConversation` - Basic conversation creation
- `CreateConversationWithAttachments` - Conversation with file attachments

**Success Response (201):**
```json
{
  "id": "number",
  "listingId": "number",
  "listingTitle": "string",
  "listingImageUrl": "string",
  "subject": "string",
  "buyer": {
    "id": "number",
    "username": "string",
    "email": "string",
    "profileImageUrl": "string"
  },
  "seller": {
    "id": "number",
    "username": "string",
    "email": "string",
    "profileImageUrl": "string"
  },
  "status": "string",
  "lastMessageAt": "string",
  "unreadCount": "number",
  "createdAt": "string",
  "updatedAt": "string",
  "version": "number",
  "deletedAt": "string (null if active)"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User cannot access this listing
- **404 Not Found**: Listing not found
- **409 Conflict**: Conversation already exists between these users for this listing

### **GET /api/conversations/my-conversations**
Get user's conversations with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 20)

**Response:**
```json
{
  "content": [
    {
      "id": "number",
      "listingId": "number",
      "listingTitle": "string",
      "listingImageUrl": "string",
      "buyer": {
        "id": "number",
        "username": "string",
        "email": "string"
      },
      "seller": {
        "id": "number",
        "username": "string",
        "email": "string"
      },
      "status": "string",
      "lastMessageAt": "string",
      "unreadCount": "number",
      "createdAt": "string",
      "updatedAt": "string",
      "recentMessages": [
        {
          "id": "number",
          "content": "string",
          "messageType": "string",
          "isRead": "boolean",
          "createdAt": "string",
          "sender": {
            "id": "number",
            "username": "string"
          }
        }
      ]
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "currentPage": "number"
}
```

### **GET /api/conversations/{id}**
Get a specific conversation by ID.

**Response:**
```json
{
  "id": "number",
  "listingId": "number",
  "listingTitle": "string",
  "listingImageUrl": "string",
  "buyer": {
    "id": "number",
    "username": "string",
    "email": "string"
  },
  "seller": {
    "id": "number",
    "username": "string",
    "email": "string"
  },
  "status": "string",
  "lastMessageAt": "string",
  "unreadCount": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### **GET /api/conversations/{id}/messages**
Get messages in a conversation with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Page size (default: 50)

**Response:**
```json
{
  "content": [
    {
      "id": "number",
      "conversationId": "number",
      "content": "string",
      "messageType": "string",
      "isRead": "boolean",
      "readAt": "string",
      "createdAt": "string",
      "sender": {
        "id": "number",
        "username": "string",
        "email": "string",
        "profileImageUrl": "string"
      },
      "attachments": [
        {
          "id": "number",
          "fileName": "string",
          "contentType": "string",
          "size": "number",
          "fileUrl": "string",
          "createdAt": "string"
        }
      ]
    }
  ],
  "totalElements": "number",
  "totalPages": "number",
  "currentPage": "number"
}
```

### **POST /api/conversations/{id}/messages**
Send a message in a conversation.

**Request Body:**
```json
{
  "content": "string",
  "messageType": "string (optional, default: 'text')",
  "replyToMessageId": "number (optional)",
  "attachmentIds": ["number"] (optional),
  "clientMessageId": "string (optional)",
  "timestamp": "string (optional)"
}
```

**Validation Groups:**
- `SendTextMessage` - Basic text message
- `SendMessageWithAttachments` - Message with file attachments
- `ReplyToMessage` - Reply to a specific message

**Success Response (201):**
```json
{
  "id": "number",
  "conversationId": "number",
  "content": "string",
  "messageType": "string",
  "isRead": "boolean",
  "readAt": "string",
  "createdAt": "string",
  "editedAt": "string (null if not edited)",
  "isEdited": "boolean",
  "version": "number",
  "deletedAt": "string (null if active)",
  "sender": {
    "id": "number",
    "username": "string"
  },
  "attachments": [
    {
      "id": "number",
      "fileName": "string",
      "contentType": "string",
      "size": "number",
      "fileUrl": "string",
      "uploadStatus": "string",
      "errorMessage": "string (null if successful)",
      "createdAt": "string"
    }
  ]
}
```

**Error Responses:**
- **400 Bad Request**: Invalid message content or validation errors
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User not participant in conversation
- **404 Not Found**: Conversation not found
- **413 Payload Too Large**: Message content exceeds maximum length

### **PATCH /api/messages/{id}/read**
Mark a message as read.

**Response:**
```json
{
  "message": "Message marked as read successfully"
}
```

### **PATCH /api/conversations/{id}/read-all**
Mark all messages in a conversation as read for the current user.

**Response:**
```json
{
  "message": "All messages marked as read successfully"
}
```

### **PUT /api/messages/{id}**
Edit a message (within 5 minutes of creation).

**Request Body:**
```json
{
  "content": "string"
}
```

**Response:**
```json
{
  "id": "number",
  "content": "string",
  "editedAt": "string",
  "isEdited": "boolean",
  "version": "number"
}
```

### **DELETE /api/messages/{id}**
Delete a message (within 1 hour of creation).

**Response:**
```json
{
  "message": "Message deleted successfully"
}
```

### **PATCH /api/conversations/{id}/participants/{participantId}/mute**
Mute/unmute a conversation participant.

**Request Body:**
```json
{
  "muted": "boolean",
  "mutedUntil": "string (optional, ISO date)"
}
```

**Response:**
```json
{
  "message": "Participant muted/unmuted successfully"
}
```

### **PATCH /api/conversations/{id}/archive**
Archive a conversation for the current user.

**Response:**
```json
{
  "message": "Conversation archived successfully"
}
```

### **PATCH /api/conversations/{id}/status**
Update conversation status.

**Query Parameters:**
- `status` (required): New status value

**Response:**
```json
{
  "message": "Conversation status updated successfully"
}
```

### **POST /api/conversations/{id}/messages/attachments**
Upload file attachment for a message.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (required): File to upload

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP (max 5MB)
- Documents: PDF, DOC, DOCX (max 10MB)

**Response:**
```json
{
  "fileUrl": "string",
  "fileName": "string",
  "contentType": "string",
  "size": "number",
  "attachmentId": "number",
  "message": "Attachment uploaded successfully"
}
```

### **POST /api/conversations/{id}/messages/with-attachments**
Send a message with file attachments.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `content` (optional): Message content
- `messageType` (required): Type of message ('text', 'image', 'document')
- `files` (optional): Array of files to attach

**Validation Rules:**
- Either `content` or `files` must be provided
- Maximum content length: 1000 characters
- Maximum 10 files per message

**Response:**
```json
{
  "id": "number",
  "conversationId": "number",
  "content": "string",
  "messageType": "string",
  "isRead": "boolean",
  "createdAt": "string",
  "sender": {
    "id": "number",
    "username": "string"
  },
  "attachments": [
    {
      "id": "number",
      "fileName": "string",
      "contentType": "string",
      "size": "number",
      "fileUrl": "string",
      "uploadStatus": "string",
      "createdAt": "string"
    }
  ],
  "message": "Message sent successfully"
}
```

---

## **🚀 Enhanced Messaging Features**

> **📋 Current Status: Phase 1 Complete** ✅
> 
> The messaging system foundation is **production-ready** with comprehensive testing (205+ tests passing). All database entities, repositories, and validation are implemented and tested. Ready for Phase 2 (service layer and controllers).

## **🚀 Enhanced Messaging Features**

### **Advanced Message Management**
- **Message Editing**: Edit messages within 5 minutes of creation
- **Message Deletion**: Delete messages within 1 hour of creation
- **Soft Delete**: Messages are logically deleted, preserving conversation integrity
- **Version Control**: Optimistic locking prevents concurrent modification conflicts

### **Participant Management**
- **Mute Functionality**: Mute conversations temporarily or permanently
- **Read Tracking**: Track which messages each participant has read
- **Role-based Access**: Buyer and seller roles with appropriate permissions

### **File Attachments**
- **Upload Status Tracking**: Monitor file upload progress and handle failures
- **File Type Validation**: Support for images, documents, and other file types
- **Error Handling**: Detailed error messages for failed uploads

### **Database Schema**
The messaging system uses enhanced PostgreSQL features:
- **Soft Delete**: `deleted_at` timestamps for logical deletion
- **Optimistic Locking**: `version` fields prevent concurrent conflicts
- **Advanced Constraints**: Prevent empty content, self-conversations
- **Efficient Indexing**: Fast queries for user conversations and unread messages
- **Triggers**: Automatic timestamp updates and participant management

---

## **🚫 User Safety & Moderation Endpoints**

These endpoints provide user safety features including blocking and reporting functionality.

### **User-Level Blocking**

User-level blocking prevents all interactions between two users across the entire platform (conversations, messages, etc.).

### **POST /api/users/block/{userId}**
Block another user completely across the platform.

**Authentication**: Required

**Path Parameters**:
- `userId` (required): The ID of the user to block

**Headers**:
- `Authorization: Bearer {token}` (required)
- `Accept-Language: en|ar` (optional, default: "en")

**Response:**
```json
{
  "status": "success",
  "message": "User has been blocked successfully",
  "data": null
}
```

**Error Responses:**
```json
// 404 - User not found
{
  "status": "error",
  "message": "User not found with id: 123"
}

// 400 - Cannot block yourself
{
  "status": "error",
  "message": "Cannot block yourself"
}

// 400 - User already blocked
{
  "status": "error",
  "message": "User is already blocked"
}

// 401 - Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl -X POST "http://localhost:8080/api/users/block/123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Accept-Language: en"
```

---

### **DELETE /api/users/block/{userId}**
Remove block from a previously blocked user.

**Authentication**: Required

**Path Parameters**:
- `userId` (required): The ID of the user to unblock

**Headers**:
- `Authorization: Bearer {token}` (required)
- `Accept-Language: en|ar` (optional, default: "en")

**Response:**
```json
{
  "status": "success",
  "message": "User has been unblocked successfully",
  "data": null
}
```

**Error Responses:**
```json
// 404 - User not found
{
  "status": "error",
  "message": "User not found with id: 123"
}

// 400 - User not blocked
{
  "status": "error",
  "message": "User is not blocked"
}

// 401 - Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl -X DELETE "http://localhost:8080/api/users/block/123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Accept-Language: en"
```

---

### **GET /api/users/block**
Get list of users blocked by the current user.

**Authentication**: Required

**Headers**:
- `Authorization: Bearer {token}` (required)

**Response:**
```json
[
  {
    "id": 1,
    "blocker": {
      "id": 10,
      "username": "john_doe",
      "email": "john@example.com"
    },
    "blocked": {
      "id": 20,
      "username": "spam_user",
      "email": "spam@example.com"
    },
    "createdAt": "2025-01-15T10:30:00"
  },
  {
    "id": 2,
    "blocker": {
      "id": 10,
      "username": "john_doe",
      "email": "john@example.com"
    },
    "blocked": {
      "id": 21,
      "username": "another_blocked",
      "email": "blocked@example.com"
    },
    "createdAt": "2025-01-16T14:20:00"
  }
]
```

**Error Responses:**
```json
// 401 - Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/users/block" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

### **GET /api/users/block/{userId}/status**
Check if a specific user is blocked by the current user.

**Authentication**: Required

**Path Parameters**:
- `userId` (required): The ID of the user to check

**Headers**:
- `Authorization: Bearer {token}` (required)

**Response:**
```json
{
  "status": "success",
  "message": "Block status retrieved",
  "data": true
}
```

**Error Responses:**
```json
// 404 - User not found
{
  "status": "error",
  "message": "User not found with id: 123"
}

// 401 - Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/users/block/123/status" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

### **Conversation-Level Blocking**

Conversation-level blocking only blocks messages within a specific conversation.

### **PATCH /api/conversations/{id}/block**
Block a user in a specific conversation. Once blocked, no further messages can be sent in this conversation.

**Authentication**: Required

**Path Parameters**:
- `id` (required): The conversation ID

**Headers**:
- `Authorization: Bearer {token}` (required)
- `Accept-Language: en|ar` (optional, default: "en")

**Response:**
```json
{
  "status": "success",
  "message": "User has been blocked successfully",
  "data": null
}
```

**Error Responses:**
```json
// 404 - Conversation not found
{
  "status": "error",
  "message": "Conversation not found with id: 123"
}

// 404 - User not found
{
  "status": "error",
  "message": "User not found with id: 456"
}

// 400 - Not a participant
{
  "status": "error",
  "message": "Access denied: Not a participant in this conversation"
}

// 401 - Unauthorized
{
  "status": "error",
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl -X PATCH "http://localhost:8080/api/conversations/123/block" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Accept-Language: en"
```

---

### **POST /api/reports**
Submit a report against another user for inappropriate behavior, spam, harassment, or other violations.

**Authentication**: Required

**Headers**:
- `Authorization: Bearer {token}` (required)
- `Accept-Language: en|ar` (optional, default: "en")
- `Content-Type: application/json`

**Request Body:**
```json
{
  "reportedUserId": 123,
  "conversationId": 456,
  "reportType": "SPAM",
  "reason": "User is sending spam messages repeatedly"
}
```

**Request Fields**:
- `reportedUserId` (required, number): The ID of the user being reported
- `conversationId` (optional, number): The conversation ID if the report is related to a specific conversation
- `reportType` (required, string, max 50 chars): Type of report (e.g., SPAM, HARASSMENT, SCAM, FRAUD, INAPPROPRIATE_CONTENT, OTHER)
- `reason` (required, string, max 1000 chars): Detailed explanation of why the user is being reported

**Response:**
```json
{
  "status": "success",
  "message": "User has been reported successfully",
  "data": {
    "id": 789,
    "reporter": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    },
    "reportedUser": {
      "id": 123,
      "username": "spam_user",
      "email": "spam@example.com"
    },
    "conversation": {
      "id": 456
    },
    "reportType": "SPAM",
    "reason": "User is sending spam messages repeatedly",
    "status": "PENDING",
    "createdAt": "2025-10-30T10:30:00",
    "updatedAt": "2025-10-30T10:30:00"
  }
}
```

**Error Responses:**
```json
// 400 - Self-reporting
{
  "status": "error",
  "message": "Cannot report yourself"
}

// 400 - Duplicate pending report
{
  "status": "error",
  "message": "You have already submitted a pending report against this user"
}

// 400 - Not a conversation participant
{
  "status": "error",
  "message": "You are not a participant in this conversation"
}

// 404 - Reported user not found
{
  "status": "error",
  "message": "User not found with id: 123"
}

// 404 - Conversation not found
{
  "status": "error",
  "message": "Conversation not found with id: 456"
}

// 400 - Validation errors
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "reportedUserId": "Reported user ID is required",
    "reportType": "Report type is required",
    "reason": "Reason is required"
  }
}
```

**Example:**
```bash
curl -X POST "http://localhost:8080/api/reports" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "reportedUserId": 123,
    "conversationId": 456,
    "reportType": "SPAM",
    "reason": "User is sending spam messages repeatedly"
  }'
```

**Report Types**:
- `SPAM`: Unsolicited or repetitive messages
- `HARASSMENT`: Abusive, threatening, or harassing behavior
- `SCAM`: Fraudulent or deceptive behavior
- `FRAUD`: Attempting to defraud or steal
- `INAPPROPRIATE_CONTENT`: Offensive, explicit, or inappropriate content
- `OTHER`: Other violations not covered above

**Report Statuses**:
- `PENDING`: Report has been submitted and is awaiting review
- `REVIEWED`: Report has been reviewed by a moderator
- `RESOLVED`: Report has been resolved with action taken
- `DISMISSED`: Report was reviewed and dismissed (no action taken)

---

### **GET /api/reports/my-reports**
Get all reports submitted by the current user with pagination.

**Authentication**: Required

**Headers**:
- `Authorization: Bearer {token}` (required)

**Query Parameters**:
- `page` (optional, number, default: 0): Page number (0-indexed)
- `size` (optional, number, default: 20): Number of reports per page
- `sortBy` (optional, string, default: "createdAt"): Field to sort by
- `sortDir` (optional, string, default: "desc"): Sort direction (asc or desc)

**Response:**
```json
{
  "content": [
    {
      "id": 789,
      "reporter": {
        "id": 1,
        "username": "john_doe"
      },
      "reportedUser": {
        "id": 123,
        "username": "spam_user"
      },
      "conversation": {
        "id": 456
      },
      "reportType": "SPAM",
      "reason": "User is sending spam messages repeatedly",
      "status": "PENDING",
      "createdAt": "2025-10-30T10:30:00",
      "updatedAt": "2025-10-30T10:30:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "unsorted": false
    }
  },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "first": true,
  "number": 0,
  "size": 20,
  "numberOfElements": 1
}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/reports/my-reports?page=0&size=20&sortBy=createdAt&sortDir=desc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

## **👨‍💼 Admin - Report Management Endpoints**

These endpoints are restricted to users with `ADMIN` or `MODERATOR` role.

### **GET /api/admin/reports**
Get all user reports with optional filtering by status and pagination.

**Authentication**: Required (ADMIN or MODERATOR role)

**Headers**:
- `Authorization: Bearer {token}` (required)

**Query Parameters**:
- `status` (optional): Filter by status (PENDING, REVIEWED, RESOLVED, DISMISSED)
- `page` (optional, number, default: 0): Page number (0-indexed)
- `size` (optional, number, default: 20): Number of reports per page
- `sortBy` (optional, string, default: "createdAt"): Field to sort by
- `sortDir` (optional, string, default: "desc"): Sort direction (asc or desc)

**Response:**
```json
{
  "content": [
    {
      "id": 789,
      "reporterId": 1,
      "reporterUsername": "john_doe",
      "reporterEmail": "john@example.com",
      "reportedUserId": 123,
      "reportedUserUsername": "spam_user",
      "reportedUserEmail": "spam@example.com",
      "conversationId": 456,
      "listingId": 789,
      "listingTitle": "2023 Toyota Camry",
      "reportType": "SPAM",
      "reportTypeDisplay": "Spam",
      "reason": "User is sending spam messages repeatedly",
      "status": "PENDING",
      "adminNotes": null,
      "resolvedById": null,
      "resolvedByUsername": null,
      "createdAt": "2025-10-30T10:30:00",
      "updatedAt": "2025-10-30T10:30:00",
      "resolvedAt": null
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 15,
  "totalPages": 1
}
```

**Example:**
```bash
# Get all pending reports
curl -X GET "http://localhost:8080/api/admin/reports?status=PENDING&page=0&size=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."

# Get all reports (no filter)
curl -X GET "http://localhost:8080/api/admin/reports" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

### **GET /api/admin/reports/{id}**
Get detailed information about a specific report.

**Authentication**: Required (ADMIN or MODERATOR role)

**Path Parameters**:
- `id` (required): The report ID

**Headers**:
- `Authorization: Bearer {token}` (required)

**Response:**
```json
{
  "status": "success",
  "message": "Report retrieved successfully",
  "data": {
    "id": 789,
    "reporterId": 1,
    "reporterUsername": "john_doe",
    "reporterEmail": "john@example.com",
    "reportedUserId": 123,
    "reportedUserUsername": "spam_user",
    "reportedUserEmail": "spam@example.com",
    "conversationId": 456,
    "listingId": 789,
    "listingTitle": "2023 Toyota Camry",
    "reportType": "SPAM",
    "reportTypeDisplay": "Spam",
    "reason": "User is sending spam messages repeatedly",
    "status": "PENDING",
    "adminNotes": null,
    "createdAt": "2025-10-30T10:30:00",
    "updatedAt": "2025-10-30T10:30:00"
  }
}
```

**Example:**
```bash
curl -X GET "http://localhost:8080/api/admin/reports/789" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

### **PATCH /api/admin/reports/{id}/review**
Mark a report as reviewed (changes status from PENDING to REVIEWED).

**Authentication**: Required (ADMIN or MODERATOR role)

**Path Parameters**:
- `id` (required): The report ID

**Headers**:
- `Authorization: Bearer {token}` (required)
- `Accept-Language: en|ar` (optional, default: "en")

**Response:**
```json
{
  "status": "success",
  "message": "Report has been marked as reviewed",
  "data": {
    "id": 789,
    "status": "REVIEWED",
    "updatedAt": "2025-10-30T11:00:00"
  }
}
```

**Example:**
```bash
curl -X PATCH "http://localhost:8080/api/admin/reports/789/review" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Accept-Language: en"
```

---

### **PATCH /api/admin/reports/{id}/resolve**
Resolve a report with admin notes (marks as RESOLVED).

**Authentication**: Required (ADMIN or MODERATOR role)

**Path Parameters**:
- `id` (required): The report ID

**Headers**:
- `Authorization: Bearer {token}` (required)
- `Accept-Language: en|ar` (optional, default: "en")
- `Content-Type: application/json`

**Request Body:**
```json
{
  "adminNotes": "User has been warned. Account suspended for 7 days."
}
```

**Request Fields**:
- `adminNotes` (required, string, max 500 chars): Admin notes explaining the resolution

**Response:**
```json
{
  "status": "success",
  "message": "Report has been resolved successfully",
  "data": {
    "id": 789,
    "status": "RESOLVED",
    "adminNotes": "User has been warned. Account suspended for 7 days.",
    "resolvedById": 5,
    "resolvedByUsername": "admin_user",
    "resolvedAt": "2025-10-30T11:30:00",
    "updatedAt": "2025-10-30T11:30:00"
  }
}
```

**Error Responses:**
```json
// 400 - Report already resolved
{
  "status": "error",
  "message": "Report is already resolved"
}

// 400 - Admin notes required
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "adminNotes": "Admin notes are required"
  }
}
```

**Example:**
```bash
curl -X PATCH "http://localhost:8080/api/admin/reports/789/resolve" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "adminNotes": "User has been warned. Account suspended for 7 days."
  }'
```

---

### **PATCH /api/admin/reports/{id}/dismiss**
Dismiss a report with admin notes (marks as DISMISSED).

**Authentication**: Required (ADMIN or MODERATOR role)

**Path Parameters**:
- `id` (required): The report ID

**Headers**:
- `Authorization: Bearer {token}` (required)
- `Accept-Language: en|ar` (optional, default: "en")
- `Content-Type: application/json`

**Request Body:**
```json
{
  "adminNotes": "Report reviewed. No violation found. Reporter was mistaken."
}
```

**Request Fields**:
- `adminNotes` (required, string, max 500 chars): Admin notes explaining why the report was dismissed

**Response:**
```json
{
  "status": "success",
  "message": "Report has been dismissed",
  "data": {
    "id": 789,
    "status": "DISMISSED",
    "adminNotes": "Report reviewed. No violation found. Reporter was mistaken.",
    "resolvedById": 5,
    "resolvedByUsername": "admin_user",
    "resolvedAt": "2025-10-30T11:45:00",
    "updatedAt": "2025-10-30T11:45:00"
  }
}
```

**Error Responses:**
```json
// 400 - Report already dismissed
{
  "status": "error",
  "message": "Report is already dismissed"
}

// 403 - Insufficient permissions
{
  "status": "error",
  "message": "Access denied: ADMIN or MODERATOR role required"
}
```

**Example:**
```bash
curl -X PATCH "http://localhost:8080/api/admin/reports/789/dismiss" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "adminNotes": "Report reviewed. No violation found. Reporter was mistaken."
  }'
```

---

## **🔍 Search & Filter Endpoints**

### **POST /api/listings/search**
Search car listings with advanced filtering.

**Request Body:**
```json
{
  "brandId": "number",
  "modelId": "number",
  "minPrice": "number",
  "maxPrice": "number",
  "minYear": "number",
  "maxYear": "number",
  "locationId": "number",
  "fuelTypeId": "number",
  "transmissionId": "number"
}
```

**Response:**
```json
{
  "content": [
    {
      "id": "number",
      "title": "string",
      "modelYear": "number",
      "mileage": "number",
      "price": "number",
      "currency": "string"
    }
  ],
  "totalElements": "number",
  "totalPages": "number"
}
```

---

## **📊 Analytics & Counting Endpoints**

These endpoints provide analytics data and counts for car listings, perfect for building dashboards, filter UIs, and tabbed interfaces like AutoTrader UK.

### **GET /api/listings/count**
Get total count of approved car listings (approved=true, sold=false, archived=false).

**Response:**
```json
{
  "count": 2543
}
```

---

### **POST /api/listings/count**
Get count of car listings matching filter criteria using POST request body.

**Request Body:**
```json
{
  "brandSlugs": ["toyota", "honda"],
  "modelSlugs": ["camry", "civic"],
  "minYear": 2020,
  "maxYear": 2024,
  "minPrice": 15000,
  "maxPrice": 50000,
  "minMileage": 0,
  "maxMileage": 100000,
  "location": ["damascus"],
  "fuelTypeSlugs": ["gasoline"],
  "sellerTypeIds": [1, 2],
  "transmissionIds": [1],
  "bodyStyleSlugs": ["sedan", "suv"],
  "isSold": false,
  "isArchived": false,
  "searchQuery": "toyota"
}
```

**Response:**
```json
{
  "count": 42
}
```

---

### **GET /api/listings/count/filter**
Get count of car listings matching filter criteria using query parameters.

**Query Parameters:**
- `brandSlugs` (optional, repeatable): Brand slugs (e.g., `?brandSlugs=toyota&brandSlugs=honda`)
- `modelSlugs` (optional, repeatable): Model slugs
- `minYear` (optional): Minimum year
- `maxYear` (optional): Maximum year
- `location` (optional, repeatable): Location slugs
- `locationId` (optional): Location ID
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `minMileage` (optional): Minimum mileage
- `maxMileage` (optional): Maximum mileage
- `isSold` (optional): Include sold listings (default: false)
- `isArchived` (optional): Include archived listings (default: false)
- `sellerTypeIds` (optional, repeatable removal): Seller type IDs
- `transmissionIds` (optional, repeatable): Transmission IDs
- `fuelTypeSlugs` (optional, repeatable): Fuel type slugs (e.g., gasoline, diesel)
- `bodyType` (optional, repeatable): Body style slugs (e.g., sedan, suv)
- `searchQuery` (optional): Text search query (English/Arabic)

**Response:**
```json
{
  "count": 25
}
```

---

### **GET /api/listings/counts/breakdown**
Get count breakdown for all filter options (brands, models, years, etc.) to display in filter UI.

**Response:**
```json
{
  "years": {
    "2024": 150,
    "2023": 200,
    "2022": 180
  },
  "brands": {
    "toyota": 120,
    "honda": 95,
    "nissan": 80
  },
  "models": {
    "camry": 45,
    "civic": 38,
    "corolla": 52
  }
}
```

---

### **POST /api/listings/counts/breakdown**
Get count breakdown for filter options with existing filters applied. Shows counts within those constraints.

**Request Body:**
```json
{
  "brandSlugs": ["toyota"],
  "minYear": 2020
}
```

**Response:**
```json
{
  "years": {
    "2024": 45,
    "2023": 60,
    "2022": 55
  },
  "brands": {
    "toyota": 120
  },
  "models": {
    "camry": 45,
    "corolla": 52
  }
}
```

---

### **GET /api/listings/counts/years**
Get count of listings grouped by model year (sorted newest first).

**Query Parameters:**
- `brandSlugs` (optional, repeatable): Filter by brands
- `modelSlugs` (optional, repeatable): Filter by models
- `location` (optional, repeatable): Filter by locations
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `minMileage` (optional): Minimum mileage
- `maxMileage` (optional): Maximum mileage

**Response:**
```json
{
  "2024": 150,
  "2023": 200,
  "2022": 180,
  "2021": 180,
  "2020": 160
}
```

---

### **GET /api/listings/counts/brands**
Get count of listings grouped by brand.

**Query Parameters:**
- `modelSlugs` (optional, repeatable): Filter by models
- `minYear` (optional): Minimum year
- `maxYear` (optional): Maximum year
- `location` (optional, repeatable): Filter by locations
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price

**Response:**
```json
{
  "toyota": 120,
  "honda": 95,
  "nissan": 80,
  "bmw": 60
}
```

---

### **GET /api/listings/counts/models**
Get count of listings grouped by model.

**Query Parameters:**
- `brandSlugs` (optional, repeatable): Filter by brands
- `minYear` (optional): Minimum year
- `maxYear` (optional): Maximum year
- `location` (optional, repeatable): Filter by locations
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price

**Response:**
```json
{
  "camry": 45,
  "civic": 38,
  "corolla": 52,
  "altima": 28
}
```

---

### **GET /api/listings/counts/seller-types**
Get count of listings grouped by seller type (Private/Dealer).

**Query Parameters:**
- `brandSlugs` (optional, repeatable): Filter by brands
- `modelSlugs` (optional, repeatable): Filter by models
- `minYear` (optional): Minimum year
- `maxYear` (optional): Maximum year
- `location` (optional, repeatable): Filter by locations
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `minMileage` (optional): Minimum mileage
- `maxMileage` (optional): Maximum mileage

**Response:**
```json
{
  "private": 22771,
  "dealer": 118102
}
```

---

### **GET /api/listings/counts/fuel-types**
Get count of listings grouped by fuel type (Gasoline, Diesel, Electric, Hybrid, etc.).

**Query Parameters:**
- `brandSlugs` (optional, repeatable): Filter by brands
- `modelSlugs` (optional, repeatable): Filter by models
- `minYear` (optional): Minimum year
- `maxYear` (optional): Maximum year
- `location` (optional, repeatable): Filter by locations
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `minMileage` (optional): Minimum mileage
- `maxMileage` (optional): Maximum mileage

**Response:**
```json
{
  "gasoline": 1500,
  "diesel": 800,
  "electric": 200,
  "hybrid": 150
}
```

---

### **GET /api/listings/counts/body-styles**
Get count of listings grouped by body style (Sedan, SUV, Hatchback, etc.). Perfect for displaying counts in category tabs like AutoTrader UK.

**Query Parameters:**
- `brandSlugs` (optional, repeatable): Filter by brands
- `modelSlugs` (optional, repeatable): Filter by models
- `minYear` (optional): Minimum year
- `maxYear` (optional): Maximum year
- `location` (optional, repeatable): Filter by locations
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `minMileage` (optional): Minimum mileage
- `maxMileage` (optional): Maximum mileage
- `fuelTypeSlugs` (optional, repeatable): Filter by fuel types
- `transmissionIds` (optional, repeatable): Filter by transmission types

**Response:**
```json
{
  "sedan": 1500,
  "suv": 800,
  "hatchback": 400,
  "coupe": 200,
  "pickup": 150
}
```

---

### **GET /api/listings/counts/transmissions**
Get count of listings grouped by transmission type (Manual, Automatic, etc.).

**Query Parameters:**
- `brandSlugs` (optional, repeatable): Filter by brands
- `modelSlugs` (optional, repeatable): Filter by models
- `minYear` (optional): Minimum year
- `maxYear` (optional): Maximum year
- `location` (optional, repeatable): Filter by locations
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `minMileage` (optional): Minimum mileage
- `maxMileage` (optional): Maximum mileage
- `fuelTypeSlugs` (optional, repeatable): Filter by fuel types
- `bodyStyleIds` (optional, repeatable): Filter by body style IDs

**Response:**
```json
{
  "manual": 1200,
  "automatic": 800,
  "cvt": 100
}
```

---

## **👤 User Profile Endpoints**

### **GET /api/users/profile**
Get current user's profile information.

**Response:**
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "profileImageUrl": "string",
  "createdAt": "string"
}
```

### **PUT /api/users/profile**
Update current user's profile information.

**Request Body:**
```json
{
  "username": "string",
  "email": "string"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

---

## **⭐ Favorites Endpoints**

### **POST /api/favorites**
Add a car listing to favorites.

**Request Body:**
```json
{
  "listingId": "number"
}
```

**Response:**
```json
{
  "message": "Added to favorites successfully"
}
```

### **DELETE /api/favorites/{listingId}**
Remove a car listing from favorites.

**Response:**
```json
{
  "message": "Removed from favorites successfully"
}
```

### **GET /api/favorites**
Get user's favorite listings.

**Response:**
```json
{
  "content": [
    {
      "id": "number",
      "listingId": "number",
      "listing": {
        "id": "number",
        "title": "string",
        "price": "number",
        "currency": "string"
      },
      "createdAt": "string"
    }
  ],
  "totalElements": "number"
}
```

---

## **📧 Newsletter Endpoints**

### **POST /api/newsletter/subscribe**
Subscribe to newsletter.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "message": "Subscribed to newsletter successfully"
}
```

### **DELETE /api/newsletter/unsubscribe**
Unsubscribe from newsletter.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "message": "Unsubscribed from newsletter successfully"
}
```

---

## **🔧 Reference Data Endpoints**

### **GET /api/reference-data/car-brands**
Get all car brands.

**Response:**
```json
[
  {
    "id": "number",
    "name": "string",
    "slug": "string",
    "displayNameEn": "string",
    "displayNameAr": "string"
  }
]
```

### **GET /api/reference-data/car-models**
Get car models for a specific brand.

**Query Parameters:**
- `brandId` (required): Brand ID

**Response:**
```json
[
  {
    "id": "number",
    "name": "string",
    "slug": "string",
    "displayNameEn": "string",
    "displayNameAr": "string",
    "brandId": "number"
  }
]
```

### **GET /api/reference-data/locations**
Get all locations.

**Response:**
```json
[
  {
    "id": "number",
    "displayNameEn": "string",
    "displayNameAr": "string",
    "slug": "string",
    "governorate": {
      "id": "number",
      "displayNameEn": "string",
      "displayNameAr": "string"
    }
  }
]
```

---

## **📝 Error Responses**

All endpoints return consistent error responses:

```json
{
  "timestamp": "string",
  "status": "number",
  "error": "string",
  "message": "string",
  "path": "string"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## **🔐 Authentication**

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

**Public Endpoints (no authentication required):**
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/listings` (read-only)
- `GET /api/listings/{id}` (read-only)
- `GET /api/reference-data/*`

---

## **📊 Rate Limiting**

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **File uploads**: 10 requests per minute

---

## **🌐 Internationalization**

The API supports both English and Arabic:
- Response messages are localized
- Error messages are in the user's preferred language
- Content can be returned in both languages where applicable

---

## **📱 File Uploads**

### **Supported File Types:**
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX
- **Maximum file size**: 10MB per file

### **Upload Endpoints:**
- `POST /api/listings/{id}/images` - Upload listing images
- `POST /api/messages/{id}/attachments` - Upload message attachments

---

## **🔍 Testing**

### **Test Environment:**
- **Base URL**: `http://localhost:8080/api`
- **Test Database**: Separate test database with sample data
- **Authentication**: Use test user credentials for protected endpoints

### **Sample Test Data:**
- Test users with various roles
- Sample car listings
- Test conversations and messages
- Reference data (brands, models, locations)

---

## **📈 Performance**

### **Response Times:**
- **Simple queries**: < 100ms
- **Complex searches**: < 500ms
- **File uploads**: < 2s (depending on file size)

### **Optimization Features:**
- Database indexing on frequently queried fields
- Pagination for large result sets
- Caching for reference data
- Lazy loading for related entities

---

## **🔒 Security**

### **Security Features:**
- JWT-based authentication
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Rate limiting
- File type validation

### **Data Privacy:**
- User data encryption
- Secure file storage
- Audit logging
- GDPR compliance considerations

---

## **📚 Additional Resources**

- **Swagger UI**: Available at `/swagger-ui.html` when running locally
- **API Health Check**: `GET /actuator/health`
- **Database Schema**: See `docs/architecture/database_schema.md`
- **Development Guide**: See `docs/development/README.md`

---

*Last Updated: Phase 1 Complete - Messaging System Foundation Ready*
*Next: Service Layer Implementation & REST Controllers*
