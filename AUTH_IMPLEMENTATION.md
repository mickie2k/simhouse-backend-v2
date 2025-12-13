# Authentication Implementation Guide

## Overview
This implementation provides **separate authentication systems** for **Hosts** and **Customers** with support for:
- **JWT Authentication** (access & refresh tokens)
- **Local Strategy** (username/password)
- **Google OAuth 2.0**

Each role has its own:
- Routes (`/auth/host/*` and `/auth/customer/*`)
- Cookies (separate token names)
- Strategies and Guards
- JWT payload validation

---

## Architecture

### Customer Authentication
**Module**: `CustomerAuthModule`
**Routes**: `/auth/customer/*`
**Cookies**: `customer_access_token`, `customer_refresh_token`

### Host Authentication
**Module**: `HostAuthModule`
**Routes**: `/auth/host/*`
**Cookies**: `host_access_token`, `host_refresh_token`

---

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_REFRESH_TOKEN_SECRET=your-refresh-secret-key
JWT_ACCESS_TOKEN_EXP=60m
JWT_REFRESH_TOKEN_EXP=30d

# Cookie Expiration (hours for access, days for refresh)
COOKIE_JWT_ACCESS_TOKEN_EXP=1
COOKIE_JWT_REFRESH_TOKEN_EXP=30

# Auth Secret (base64 encoded for argon2)
AUTH_SECRET=your-base64-encoded-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Callback URLs (optional, defaults to BACKEND_URL + route)
GOOGLE_CUSTOMER_CALLBACK_URL=http://localhost:3000/auth/customer/google/callback
GOOGLE_HOST_CALLBACK_URL=http://localhost:3000/auth/host/google/callback

# Frontend & Backend URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

---

## API Endpoints

### Customer Routes

#### POST `/auth/customer/register`
Register a new customer account.
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "username": "customer1",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890"
}
```

#### POST `/auth/customer/login`
Login with email and password.
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```
**Response**: Sets `customer_access_token` and `customer_refresh_token` cookies.

#### GET `/auth/customer/google`
Initiates Google OAuth flow for customers.
**Response**: Redirects to Google login page.

#### GET `/auth/customer/google/callback`
Google OAuth callback endpoint.
**Response**: Redirects to `/customer/dashboard` with auth cookies.

#### GET `/auth/customer/profile`
Get current customer profile (requires `customer_access_token`).
**Headers**: Cookie with `customer_access_token`

#### GET `/auth/customer/refresh`
Refresh access token using refresh token.
**Headers**: Cookie with `customer_refresh_token`

#### GET `/auth/customer/logout`
Logout customer (clears cookies).
**Headers**: Cookie with `customer_access_token`

---

### Host Routes

#### POST `/auth/host/register`
Register a new host account.
```json
{
  "email": "host@example.com",
  "password": "password123",
  "username": "host1",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "0987654321"
}
```

#### POST `/auth/host/login`
Login with email and password.
```json
{
  "email": "host@example.com",
  "password": "password123"
}
```
**Response**: Sets `host_access_token` and `host_refresh_token` cookies.

#### GET `/auth/host/google`
Initiates Google OAuth flow for hosts.
**Response**: Redirects to Google login page.

#### GET `/auth/host/google/callback`
Google OAuth callback endpoint.
**Response**: Redirects to `/host/dashboard` with auth cookies.

#### GET `/auth/host/profile`
Get current host profile (requires `host_access_token`).
**Headers**: Cookie with `host_access_token`

#### GET `/auth/host/refresh`
Refresh access token using refresh token.
**Headers**: Cookie with `host_refresh_token`

#### GET `/auth/host/logout`
Logout host (clears cookies).
**Headers**: Cookie with `host_access_token`

---

## Guards Usage

### Customer Guards
```typescript
import { CustomerJwtAuthGuard } from './auth/customer-auth/guards/customer-jwt-auth.guard';
import { CustomerLocalAuthGuard } from './auth/customer-auth/guards/customer-local-auth.guard';
import { CustomerGoogleAuthGuard } from './auth/customer-auth/guards/customer-google-auth.guard';

// Protect routes
@UseGuards(CustomerJwtAuthGuard)
@Get('/customer-only-route')
async customerRoute(@Request() req) {
  // req.user contains { id, email, role: 'CUSTOMER' }
}
```

### Host Guards
```typescript
import { HostJwtAuthGuard } from './auth/host-auth/guards/host-jwt-auth.guard';
import { HostLocalAuthGuard } from './auth/host-auth/guards/host-local-auth.guard';
import { HostGoogleAuthGuard } from './auth/host-auth/guards/host-google-auth.guard';

// Protect routes
@UseGuards(HostJwtAuthGuard)
@Get('/host-only-route')
async hostRoute(@Request() req) {
  // req.user contains { id, email, role: 'HOST' }
}
```

---

## JWT Payload Structure

### Customer JWT Payload
```json
{
  "sub": 123,           // Customer ID
  "email": "customer@example.com",
  "role": "CUSTOMER",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Host JWT Payload
```json
{
  "sub": 456,           // Host ID
  "email": "host@example.com",
  "role": "HOST",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## Security Features

1. **Role Validation**: JWT strategies validate the role in the payload
2. **Separate Cookies**: Different cookie names prevent token confusion
3. **HTTP-Only Cookies**: Tokens stored in HTTP-only cookies (XSS protection)
4. **Argon2 Hashing**: Passwords hashed with Argon2 and secret
5. **Separate Routes**: Clear separation between host and customer auth flows
6. **Token Extraction**: Supports both cookies and Bearer tokens

---

## Google OAuth Setup

1. **Create OAuth 2.0 credentials** in [Google Cloud Console](https://console.cloud.google.com/)
2. **Add authorized redirect URIs**:
   - `http://localhost:3000/auth/customer/google/callback`
   - `http://localhost:3000/auth/host/google/callback`
   - Production URLs when deploying
3. **Copy Client ID and Secret** to your `.env` file

---

## Testing with cURL

### Customer Login
```bash
curl -X POST http://localhost:3000/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@example.com", "password": "password123"}' \
  -c cookies.txt

# Access protected route
curl http://localhost:3000/auth/customer/profile \
  -b cookies.txt
```

### Host Login
```bash
curl -X POST http://localhost:3000/auth/host/login \
  -H "Content-Type: application/json" \
  -d '{"email": "host@example.com", "password": "password123"}' \
  -c host-cookies.txt

# Access protected route
curl http://localhost:3000/auth/host/profile \
  -b host-cookies.txt
```

---

## Swagger Documentation

Access the Swagger UI at `http://localhost:3000/api` to explore all endpoints interactively.

- **Customer Auth**: Tag `customer-auth`
- **Host Auth**: Tag `host-auth`

---

## Migration from Old Auth

If you were using the old unified `AuthModule`, you can:

1. **Keep the old routes** for backward compatibility
2. **Gradually migrate** users to the new routes
3. **Update frontend** to use role-specific endpoints
4. **Remove old module** once migration is complete

---

## Directory Structure

```
src/auth/
├── customer-auth/
│   ├── guards/
│   │   ├── customer-jwt-auth.guard.ts
│   │   ├── customer-jwt-refresh.guard.ts
│   │   ├── customer-local-auth.guard.ts
│   │   └── customer-google-auth.guard.ts
│   ├── strategies/
│   │   ├── customer-jwt.strategy.ts
│   │   ├── customer-jwt-refresh.strategy.ts
│   │   ├── customer-local.strategy.ts
│   │   └── customer-google.strategy.ts
│   ├── customer-auth.controller.ts
│   ├── customer-auth.service.ts
│   └── customer-auth.module.ts
├── host-auth/
│   ├── guards/
│   │   ├── host-jwt-auth.guard.ts
│   │   ├── host-jwt-refresh.guard.ts
│   │   ├── host-local-auth.guard.ts
│   │   └── host-google-auth.guard.ts
│   ├── strategies/
│   │   ├── host-jwt.strategy.ts
│   │   ├── host-jwt-refresh.strategy.ts
│   │   ├── host-local.strategy.ts
│   │   └── host-google.strategy.ts
│   ├── host-auth.controller.ts
│   ├── host-auth.service.ts
│   └── host-auth.module.ts
└── [old auth files...]
```

---

## Troubleshooting

### Issue: "Cannot find module 'passport-google-oauth20'"
**Solution**: Run `npm install @types/passport-google-oauth20`

### Issue: JWT tokens not working
**Solution**: 
- Check `JWT_SECRET` and `JWT_REFRESH_TOKEN_SECRET` in `.env`
- Verify cookies are being sent with requests
- Check cookie domain/path settings

### Issue: Google OAuth redirect fails
**Solution**:
- Verify callback URLs in Google Console
- Check `GOOGLE_CUSTOMER_CALLBACK_URL` and `GOOGLE_HOST_CALLBACK_URL`
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

---

## Best Practices

1. **Always use HTTPS in production** for cookies
2. **Set appropriate cookie expiration times**
3. **Rotate JWT secrets periodically**
4. **Implement rate limiting** on login endpoints
5. **Log authentication attempts** for security monitoring
6. **Use strong password requirements**
7. **Implement 2FA** for sensitive operations

---

## Next Steps

- [ ] Add email verification for new registrations
- [ ] Implement password reset functionality
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement account lockout after failed attempts
- [ ] Add OAuth support for other providers (Facebook, GitHub, etc.)
- [ ] Implement refresh token rotation
- [ ] Add audit logging for auth events
