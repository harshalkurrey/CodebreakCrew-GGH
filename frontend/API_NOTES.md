# CampusCycle API Specification & Notes

Backend Base URL: `http://localhost:5000/api` (Backend Port: `5000`)
Default Gemini Model: `gemini-3.5-flash-lite`

---

## 1. Global Standard Response & Error Envelope

All responses adhere to the standard envelope:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation of error"
  }
}
```

### Standard Status Codes Handled
- `400 Bad Request`: Field validation errors (display `error.message` on form).
- `401 Unauthorized`: Token missing or expired (redirect client to `/login`).
- `403 Forbidden`: Permission denied (e.g. attempting owner actions as renter).
- `404 Not Found`: Entity not found.
- `409 Conflict`: Overlapping booking dates or state conflict.
- `500 Internal Server Error`: Generic failure.

---

## 2. Authentication

Identity is established exclusively via the Firebase ID token in the `Authorization` header:
```
Authorization: Bearer <firebase_id_token>
```
Client NEVER transmits `userId`, `ownerId`, or `renterId` in payload bodies.

---

## 3. Booking Statuses

Statuses are strictly distinct:
- `pending`: Rental requested by renter, awaiting owner review.
- `approved`: Owner approved the request, waiting for period start.
- `active`: Rental period has started and item is in renter's possession.
- `completed`: Owner confirmed return of the item.
- `cancelled`: Renter cancelled a pending booking.
- `rejected`: Owner rejected the pending request.

---

## 4. Pricing Fields (Server-Side Only)

Pricing is computed entirely on the server. The client never calculates or sends `totalPrice`.
- `dailyPrice`: Daily rental rate set on the item listing.
- `deposit`: Security deposit amount set on the item listing.
- `rentalDays`: Computed duration in days between `startDate` and `endDate`.
- `rentalFee`: Computed rental cost (`dailyPrice * rentalDays`).
- `totalPrice`: Total due (`rentalFee + deposit`).

---

## 5. Endpoints Reference

### 5.1 Items

#### `GET /api/items`
- **Auth Required**: No
- **Query Params**:
  - `search` (string, optional)
  - `category` (string, optional: e.g. `Calculators`, `Lab Coats`, `Blazers`, `Electronics`, `Other`)
  - `available` (boolean, optional)
- **Response Body**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "item_123",
        "title": "TI-84 Plus CE Graphing Calculator",
        "description": "Mint condition with charging cable.",
        "category": "Calculators",
        "dailyPrice": 4,
        "deposit": 30,
        "images": ["https://..."],
        "location": "Science Library / North Quad",
        "ownerId": "user_456",
        "ownerName": "Alex Chen",
        "isAvailable": true,
        "createdAt": "2026-10-01T10:00:00Z"
      }
    ]
  }
  ```

#### `GET /api/items/:id`
- **Auth Required**: No
- **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "id": "item_123",
      "title": "TI-84 Plus CE Graphing Calculator",
      "description": "Mint condition with charging cable.",
      "category": "Calculators",
      "dailyPrice": 4,
      "deposit": 30,
      "images": ["https://..."],
      "location": "Science Library / North Quad",
      "ownerId": "user_456",
      "ownerName": "Alex Chen",
      "isAvailable": true,
      "createdAt": "2026-10-01T10:00:00Z"
    }
  }
  ```

#### `POST /api/items`
- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "title": "Chemistry Lab Coat (Size M)",
    "description": "100% Cotton, clean and undamaged.",
    "category": "Lab Coats",
    "dailyPrice": 3,
    "deposit": 15,
    "images": ["https://..."],
    "location": "Life Sciences Building"
  }
  ```
  *(Note: No userId, ownerId, isAvailable, or status allowed in request body)*
- **Response Body**: `{ "success": true, "data": Item }`

#### `PUT /api/items/:id`
- **Auth Required**: Yes (Must be owner)
- **Request Body**: Partial or full item fields (`title`, `description`, `category`, `dailyPrice`, `deposit`, `images`, `location`)
- **Response Body**: `{ "success": true, "data": Item }`

#### `DELETE /api/items/:id`
- **Auth Required**: Yes (Must be owner)
- **Response Body**: `{ "success": true, "data": { "id": "item_123", "deleted": true } }`

#### `GET /api/items/owner/mine`
- **Auth Required**: Yes
- **Response Body**: `{ "success": true, "data": Item[] }`

---

### 5.2 Bookings

#### `POST /api/bookings`
- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "itemId": "item_123",
    "startDate": "2026-11-01",
    "endDate": "2026-11-05"
  }
  ```
  *(Note: Dates must be canonical `YYYY-MM-DD` strings. No totalPrice, userId, or status sent by client)*
- **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "id": "book_789",
      "itemId": "item_123",
      "itemTitle": "TI-84 Plus CE Graphing Calculator",
      "itemImage": "https://...",
      "ownerId": "user_456",
      "renterId": "user_111",
      "startDate": "2026-11-01",
      "endDate": "2026-11-05",
      "rentalDays": 4,
      "dailyPrice": 4,
      "rentalFee": 16,
      "deposit": 30,
      "totalPrice": 46,
      "status": "pending",
      "createdAt": "2026-10-23T08:00:00Z"
    }
  }
  ```

#### `GET /api/bookings/renter`
- **Auth Required**: Yes
- **Response Body**: `{ "success": true, "data": Booking[] }`

#### `GET /api/bookings/owner`
- **Auth Required**: Yes
- **Response Body**: `{ "success": true, "data": Booking[] }`

#### `POST /api/bookings/:id/cancel`
- **Auth Required**: Yes (Renter only, pending status only)
- **Response Body**: `{ "success": true, "data": Booking }`

#### `POST /api/bookings/:id/approve`
- **Auth Required**: Yes (Owner only, pending status only)
- **Response Body**: `{ "success": true, "data": Booking }`

#### `POST /api/bookings/:id/reject`
- **Auth Required**: Yes (Owner only, pending status only)
- **Response Body**: `{ "success": true, "data": Booking }`

#### `POST /api/bookings/:id/confirm-return`
- **Auth Required**: Yes (Owner only, active status only)
- **Response Body**: `{ "success": true, "data": Booking }`

---

### 5.3 Gemini AI Endpoints

#### `POST /api/ai/smart-search`
- **Auth Required**: No (Optional Auth)
- **Request Body**:
  ```json
  {
    "query": "I need a graphing calculator for Calculus exam tomorrow morning"
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "recommendations": [ ...Item[] ],
      "reasoning": "Selected graphing calculators available near campus with quick handover.",
      "fallbackUsed": false,
      "model": "gemini-3.5-flash-lite",
      "responseTimeMs": 320
    }
  }
  ```
  *(Note: Recommendations only return real items present in database; on failure or quota exhaustion, fallback to keyword search with fallback flag)*

#### `POST /api/ai/generate-description`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "Men's Navy Blazer for Career Fair",
    "category": "Blazers",
    "keyFeatures": "Size 38R, wool blend, dry cleaned"
  }
  ```
- **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "description": "Professional navy blue blazer in size 38R. High quality wool blend, freshly dry cleaned. Perfect for career fairs, presentations, and formal university interviews.",
      "suggestedDailyPrice": 8,
      "suggestedDeposit": 40,
      "model": "gemini-3.5-flash-lite",
      "responseTimeMs": 280
    }
  }
  ```
  *(Note: Output labeled 'AI suggested' and fully editable by user)*
