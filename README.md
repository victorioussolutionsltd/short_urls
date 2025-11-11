# Short URLs - NestJS Application

A simple NestJS application with TypeORM and PostgreSQL that demonstrates basic CRUD operations for URL shortening.

## Features

- NestJS framework
- TypeORM with PostgreSQL
- URL shortening with click tracking
- No authentication (public endpoints)
- Docker Compose for PostgreSQL

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Docker and Docker Compose (for database)

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start PostgreSQL using Docker Compose:
```bash
docker-compose up -d
```

3. Configure environment variables (`.env` file is already set up with default values)

## Running the Application

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm build
pnpm start:prod
```

The application will be available at `http://localhost:3000`

## API Endpoints

### URLs

- `POST /urls` - Create a new short URL
  ```json
  {
    "originalUrl": "https://example.com/very/long/url",
    "shortCode": "abc123"
  }
  ```

- `GET /urls` - Get all URLs

- `GET /urls/:id` - Get a specific URL by ID

- `GET /urls/redirect/:shortCode` - Redirect to original URL (increments click counter)

- `PATCH /urls/:id` - Update a URL
  ```json
  {
    "originalUrl": "https://newurl.com"
  }
  ```

- `DELETE /urls/:id` - Delete a URL

## Database

The application uses PostgreSQL. The database schema is automatically created and synchronized when the application starts (synchronize: true in TypeORM config).

### URL Entity

- `id` - Primary key (auto-generated)
- `originalUrl` - The original long URL
- `shortCode` - Unique short code for the URL
- `clicks` - Number of times the short URL was accessed
- `createdAt` - Timestamp when created
- `updatedAt` - Timestamp when last updated

## Development

```bash
# Run in watch mode
pnpm start:dev

# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## Stopping the Application

```bash
# Stop the database
docker-compose down

# Stop with data removal
docker-compose down -v
```

## Project Structure

```
src/
├── urls/
│   ├── dto/
│   │   ├── create-url.dto.ts
│   │   └── update-url.dto.ts
│   ├── entities/
│   │   └── url.entity.ts
│   ├── urls.controller.ts
│   ├── urls.service.ts
│   └── urls.module.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── main.ts
```
# short_urls
