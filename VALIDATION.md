# Input Validation Documentation

## Overview
This application implements comprehensive input validation to handle invalid, empty, or malformed URLs gracefully.

## URL Validation Rules

### Valid URL Requirements
1. **Required**: URL field must be present in the request
2. **Not Empty**: URL cannot be empty or contain only whitespace
3. **Protocol Required**: Must include `http://` or `https://` protocol
4. **Valid Format**: Must be a properly formatted URL
5. **Valid Hostname**: Must contain a valid hostname
6. **Length Limit**: Maximum 2048 characters

### Validation Layers

#### 1. DTO Level (create-url.dto.ts)
- Uses `class-validator` decorators
- Automatic whitespace trimming via `@Transform`
- Custom error messages for each validation rule
- Validates protocol, format, and length

#### 2. Service Level (urls.service.ts)
- Additional URL parsing validation using native `URL` class
- Protocol whitelist enforcement (http/https only)
- Hostname validation
- Short code validation (non-empty, trimmed)

#### 3. Controller Level (urls.controller.ts)
- ID format validation for numeric parameters
- Short code validation for redirect endpoints
- BadRequest exceptions for invalid inputs

## Error Responses

### Invalid or Empty URL
**Request:**
```json
{
  "originalUrl": ""
}
```

**Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["URL is required"],
  "error": "Bad Request"
}
```

### Malformed URL (Missing Protocol)
**Request:**
```json
{
  "originalUrl": "www.example.com"
}
```

**Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["Please provide a valid URL with http:// or https:// protocol"],
  "error": "Bad Request"
}
```

### Invalid Protocol
**Request:**
```json
{
  "originalUrl": "ftp://example.com"
}
```

**Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["Please provide a valid URL with http:// or https:// protocol"],
  "error": "Bad Request"
}
```

### URL Too Long
**Request:**
```json
{
  "originalUrl": "https://example.com/very-long-path-..." // > 2048 chars
}
```

**Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": ["URL is too long (maximum 2048 characters)"],
  "error": "Bad Request"
}
```

### Invalid ID Format
**Request:**
```
GET /urls/abc
```

**Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": "Invalid ID format",
  "error": "Bad Request"
}
```

### Non-existent Short Code
**Request:**
```
GET /urls/redirect/INVALID
```

**Response:** `404 Not Found`
```json
{
  "statusCode": 404,
  "message": "URL with short code INVALID not found",
  "error": "Not Found"
}
```

## Testing

Use the included `test-validation.http` file to test all validation scenarios:

```bash
# Start the application
pnpm start:dev

# Use REST Client extension in VS Code to run the tests in test-validation.http
```

## Validation Configuration

Global validation is configured in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // Strip non-whitelisted properties
  forbidNonWhitelisted: true,   // Throw error for non-whitelisted properties
  transform: true,              // Auto-transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: false,  // Explicit type conversion only
  },
  stopAtFirstError: false,      // Return all validation errors
}));
```

## Best Practices

1. **Always use HTTPS/HTTP**: Only `http://` and `https://` protocols are accepted
2. **Trim Whitespace**: URLs are automatically trimmed of leading/trailing whitespace
3. **Length Limits**: Keep URLs under 2048 characters
4. **Error Handling**: All validation errors return appropriate HTTP status codes (400/404)
5. **Type Safety**: Numeric IDs are validated and parsed safely
