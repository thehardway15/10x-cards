# API Authentication Specification

## Overview

This document describes the authentication API endpoints and their usage with JWT (JSON Web Token) based authentication.

## Endpoints

### Login
```
POST /api/auth/login

Request:
{
  "email": string,
  "password": string
}

Response (200 OK):
{
  "token": string,    // JWT token
  "user": {
    "id": string,
    "email": string,
    "role": string
  }
}

Response (400 Bad Request):
{
  "error": string
}
```

### Register
```
POST /api/auth/register

Request:
{
  "email": string,
  "password": string
}

Response (200 OK):
{
  "message": string,  // Success message with email verification instructions
  "user": {
    "id": string,
    "email": string
  }
}

Response (400 Bad Request):
{
  "error": string
}
```

### Verify Identity
```
GET /api/auth/me
Authorization: Bearer <token>

Response (200 OK):
{
  "user": {
    "id": string,
    "email": string,
    "role": string
  }
}

Response (401 Unauthorized):
{
  "error": "Unauthorized"
}
```

### Change Password
```
POST /api/auth/change-password
Authorization: Bearer <token>

Request:
{
  "currentPassword": string,
  "newPassword": string
}

Response (200 OK):
{
  "message": string,
  "token": string    // New JWT token
}

Response (400 Bad Request):
{
  "error": string
}

Response (401 Unauthorized):
{
  "error": "Unauthorized"
}
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>

Response (200 OK):
{
  "message": "Logged out successfully"
}
```

## Authentication Flow

1. **Login/Registration**:
   - User submits credentials
   - Server validates and returns JWT token
   - Client stores token in localStorage

2. **Authenticated Requests**:
   - Client includes token in Authorization header
   - Server validates token and processes request
   - On 401 response, client redirects to login

3. **Token Management**:
   - Tokens expire after 1 hour
   - New token issued after password change
   - Token removed from localStorage on logout

## Security Considerations

- Tokens are signed with HS256 algorithm
- Sensitive operations require fresh authentication
- Tokens contain minimal user data
- HTTPS required for all requests
- Token stored in localStorage (consider security implications)

## Error Handling

Common error responses:
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 500: Internal Server Error

## Client Implementation

Example of adding auth header:
```typescript
const api = {
  fetch: async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return fetch(url, options);
  }
};
```