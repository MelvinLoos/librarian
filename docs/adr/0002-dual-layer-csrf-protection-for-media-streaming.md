# ADR 0002: Dual-Layer CSRF Protection for Media Streaming

## Context
To support HTTP 206 Partial Content streaming for large PDF files without crashing the server's memory, the frontend must request the file via a native HTML `<iframe>` rather than a standard JavaScript `$fetch` call. Because iframes cannot inject custom HTTP headers (like `Authorization: Bearer <token>`), we had to configure the NestJS `JwtStrategy` to fall back to reading an `auth_token` cookie.

However, globally accepting cookie-based authentication for a REST API opens the system to Cross-Site Request Forgery (CSRF) attacks. An attacker could potentially trick an authenticated user's browser into executing state-changing requests (e.g., `PUT /users/me/progress/:bookId`) without their consent.

## Decision
We are implementing a "Dual-Layer" defense mechanism to secure the API while preserving the zero-memory chunked streaming architecture:

1. **Layer 1: Read-Only Cookie Extraction (Backend)**
   The NestJS `JwtStrategy` custom cookie extractor is explicitly restricted. It will *only* extract and validate the JWT from the `auth_token` cookie if the HTTP request method is `GET`. All state-changing operations (`POST`, `PUT`, `DELETE`) strictly require the explicit `Authorization: Bearer <token>` header, neutralizing the primary risk of CSRF.

2. **Layer 2: Strict SameSite Enforcement (Frontend)**
   The Nuxt 3 frontend configures the `auth_token` cookie with the `SameSite=Strict` attribute. This instructs the browser to refuse to attach the cookie to any requests originating from a different domain.

## Status
Accepted.

## Consequences
- **Positive:** We achieve highly performant, RAM-safe media streaming without exposing the application to state-changing CSRF attacks. The infrastructure remains lean, avoiding the need for a complex, stateful "ticket exchange" microservice.
- **Negative/Future Consideration:** If the deployment scope ever changes from a self-hosted/home-lab environment to a public internet SaaS application, `SameSite=Strict` alone may not be sufficient against advanced sub-domain attacks. At that point (V2), we will need to deprecate cookie authentication entirely in favor of generating short-lived, single-use "Streaming Tickets" via the API.