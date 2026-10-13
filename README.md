# Fastor CRM API

Express and PostgreSQL REST API for counselor accounts and prospective-client enquiries. Public enquiries can be submitted without signing in. Counselors can view all unclaimed enquiries, claim one, and view their own claimed enquiries.

## Requirements

- Node.js 20 or newer
- PostgreSQL 13 or newer

## Setup

1. Create an empty PostgreSQL database (for example, `fastor_crm`).
2. Copy `.env.example` to `.env`; set `DATABASE_URL` and a random `JWT_SECRET` of at least 32 characters.
3. Install dependencies with `npm install`.
4. Apply the schema with `psql "$env:DATABASE_URL" -f db/schema.sql` (PowerShell), or run `db/schema.sql` in your PostgreSQL client.
5. Start the API with `npm run dev` or `npm start`.

The default API address is `http://localhost:3000`. `GET /health` provides a basic health check. Configure `CLIENT_ORIGIN` to your frontend origin in production. Use HTTPS and keep `.env` out of source control.

## API

All request and response bodies use JSON. Errors have the form `{ "error": "..." }`; validation errors may include a `details` object. Authenticated endpoints require `Authorization: Bearer <token>`.

### Register a counselor

`POST /api/auth/register`

```json
{ "name": "Asha Rao", "email": "asha@example.com", "password": "a-long-password" }
```

Returns `201` with `{ employee, token }`. Email addresses are case-insensitive and unique. Passwords must be 8–72 characters.

### Log in

`POST /api/auth/login`

```json
{ "email": "asha@example.com", "password": "a-long-password" }
```

Returns `{ employee, token }` or `401` for invalid credentials. JWT lifetime is controlled by `JWT_EXPIRES_IN` (default `1d`).

### Submit a public enquiry (no authentication)

`POST /api/leads`

```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "+91 9876543210",
  "courseInterest": "Full Stack Development",
  "message": "Please contact me about the next batch."
}
```

Returns `201` with the created lead. `phone` and `message` are optional.

### List public enquiries (authentication required)

`GET /api/leads/public?limit=20&offset=0`

Returns only unclaimed leads, newest first. `limit` is 1–100; `offset` is zero or greater.

### Claim a lead (authentication required)

`POST /api/leads/:id/claim`

Returns the claimed lead. A conditional SQL update guarantees only one counselor can claim an enquiry. Returns `404` if the lead does not exist or `409` if another counselor (or the same counselor) has already claimed it.

### List your claimed enquiries (authentication required)

`GET /api/leads/mine?limit=20&offset=0`

Returns only leads claimed by the signed-in counselor, newest claim first.

## Data model

`db/schema.sql` defines `employees` and `leads`, with a foreign key from a claimed lead to its counselor and indexes for public and counselor-specific lists. If an employee account is deleted, its leads become unclaimed.

## React task

The React restaurant discovery assignment is implemented separately in [`client/`](client/). See [client/README.md](client/README.md) to run it. From the `client` directory, install dependencies and start Vite with `npm install` and `npm run dev`.
