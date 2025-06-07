# REST API Plan

## 1. Resources

- **Users** (Supabase Auth-managed, no direct DB table endpoints)
- **Flashcards** (table: `flashcards`)
- **Generations** (table: `generations`)
- **Generation Error Logs** (table: `generation_error_logs`)

## 2. Endpoints

### 2.2 Flashcard Generation (AI)

#### POST /api/generations
- Description: Create a new AI generation session and return candidate flashcards
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  {
    "sourceText": "String (1000–10000 characters)"
  }
  ```
- Response (201):
  ```json
  {
    "generation": {
      "id": "UUID",
      "model": "String",
      "generatedCount": 50,
      "acceptedUneditedCount": 0,
      "acceptedEditedCount": 0,
      "sourceTextHash": "SHA-256 hash",
      "sourceTextLength": 1234,
      "createdAt": "ISO timestamp"
    },
    "candidates": [
      { "candidateId": "UUID", "front": "...", "back": "..." },
      // ...
    ]
  }
  ```
- Errors:
  - 400: Input length not in [1000,10000]
  - 429: Rate limit exceeded
  - 502: AI service error

#### POST /api/generations/{generationId}/retry
- Description: Retry AI generation for a session after an error
- Headers: `Authorization: Bearer <token>`
- Response: Same as `POST /api/generations`

### 2.3 Flashcards (Accepted and Manual)

#### GET /api/flashcards
- Description: List user's active flashcards
- Headers: `Authorization: Bearer <token>`
- Query Parameters:
  - `page` (integer, default 1)
  - `pageSize` (integer, default 20, max 100)
  - `sortBy` (e.g. `createdAt`)
  - `sortOrder` (`asc` | `desc`)
- Response (200):
  ```json
  {
    "items": [ { "id": "UUID", "front": "...", "back": "...", "source": "manual|ai-full|ai-edited", "createdAt": "..." } ],
    "page": 1,
    "pageSize": 20,
    "total": 123
  }
  ```

#### GET /api/flashcards/{id}
- Description: Retrieve a single flashcard
- Headers: `Authorization: Bearer <token>`
- Response (200):
  ```json
  { "id": "UUID", "front": "...", "back": "...", "source": "...", "createdAt": "...", "updatedAt": "..." }
  ```
- Errors:
  - 404: Not found or belongs to another user

#### POST /api/flashcards
- Description: Create a new flashcard (manual or accept AI candidate)
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  {
    "front": "String (1–200 chars)",
    "back": "String (1–500 chars)",
    "source": "manual|ai-full|ai-edited",
    "generationId": "UUID (required if source != manual)"
  }
  ```
- Response (201):
  ```json
  { "id": "UUID", "front": "...", "back": "...", "source": "...", "createdAt": "..." }
  ```
- Errors:
  - 400: Validation failed (lengths, missing generationId)

#### POST /api/flashcards/bulk
- Description: Create multiple flashcards in one request (bulk manual or accept AI candidates)
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  [
    {
      "front": "String (1–200 chars)",
      "back": "String (1–500 chars)",
      "source": "manual|ai-full|ai-edited",
      "generationId": "UUID (required if source != manual)"
    },
    // ...
  ]
  ```
- Response (201):
  ```json
  {
    "items": [
      { "id": "UUID", "front": "...", "back": "...", "source": "...", "createdAt": "..." },
      // ...
    ]
  }
  ```
- Errors:
  - 400: Validation failed (list of errors per item)

#### PUT /api/flashcards/{id}
- Description: Update an existing flashcard (edit saved or AI candidate before accept)
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  { "front": "String (1–200)", "back": "String (1–500)" }
  ```
- Response (200): `{ "message": "Flashcard updated" }`
- Errors:
  - 400: Validation error
  - 403: Forbidden
  - 404: Not found

#### DELETE /api/flashcards/{id}
- Description: Soft-delete a flashcard
- Headers: `Authorization: Bearer <token>`
- Response (204): No content
- Errors:
  - 404: Not found or belongs to another user

### 2.4 Generations

#### GET /api/generations
- Description: List user's generation sessions
- Headers: `Authorization: Bearer <token>`
- Query Parameters: `page`, `pageSize`, `sortBy`, `sortOrder`
- Response (200):
  ```json
  {
    "items": [ { "id": "UUID", "model": "...", "generatedCount": 50, "acceptedUneditedCount": 10, "acceptedEditedCount": 5, "createdAt": "..." } ],
    "page": 1,
    "pageSize": 20,
    "total": 12
  }
  ```

#### GET /api/generations/{id}
- Description: Retrieve a specific generation session
- Headers: `Authorization: Bearer <token>`
- Response (200):
  ```json
  { "id": "UUID", "model": "...", "generatedCount": 50, "acceptedUneditedCount": 10, "acceptedEditedCount": 5, "createdAt": "..." }
  ```

### 2.5 Generation Error Logs

#### GET /api/error-logs
- Description: List AI generation error logs
- Headers: `Authorization: Bearer <token>`
- Query Parameters: `page`, `pageSize`
- Response: paginated list of `{ id, model, errorCode, errorMessage, createdAt }`

### 2.6 Repetition Integration (Optional)

#### POST /api/repetitions/import
- Description: Export accepted flashcards to spaced-repetition module
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  { "flashcardIds": ["UUID", ...] }
  ```
- Response (200): `{ "importedCount": 10 }`

## 3. Authentication and Authorization

- Mechanism: JWT via Supabase Auth
- All endpoints (except `/auth`) require `Authorization: Bearer <token>`
- Supabase RLS policies enforce row-level ownership (e.g., `auth.uid() = user_id`)
- Password operations use secure Supabase endpoints

## 4. Validation and Business Logic

- **Flashcards**:
  - `front`: 1–200 chars (DB CHECK length)
  - `back`: 1–500 chars (DB CHECK length)
  - Soft delete: set `is_deleted=true` and `deleted_at` timestamp
- **Generations**:
  - `sourceTextLength`: 1000–10000 chars
  - `generatedCount` ≥ 0 (enforced by DB)
  - `acceptedUneditedCount + acceptedEditedCount ≤ generatedCount`
- **Error handling**: AI errors are logged to `generation_error_logs`
- **Rate limiting**: throttle `/api/generations` to protect cost and stability

## 5. Pagination, Filtering, Sorting

- Standard query params: `page`, `pageSize`, `sortBy`, `sortOrder`
- Default `pageSize = 20`, max `100`
- Use DB indexes:
  - `idx_flashcards_active` for active flashcards listing
  - `idx_generations_user_id` for generation sessions
  - `idx_generation_error_logs_user_id` for error logs

## 6. Security and Performance

- Secure all endpoints with HTTPS
- Apply rate limits (e.g., 5 requests/minute) on generation endpoints
- Leverage Supabase RLS for data isolation
- Log audit events (generation, accept, reject) in application logs for KPI 