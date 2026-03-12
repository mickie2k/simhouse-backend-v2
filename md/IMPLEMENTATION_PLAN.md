# SimHouse Backend - Implementation Plan

**Date Created:** February 22, 2026  
**Status:** Planning Phase  
**Version:** 1.0

## Overview

This document outlines all unimplemented features and incomplete functionality identified in the SimHouse Backend V2 codebase. Each item includes priority level, implementation steps, and estimated complexity.

---

## Table of Contents

1. [Critical Missing Features](#critical-missing-features)
2. [Incomplete Implementations](#incomplete-implementations)
3. [Database Schema Extensions](#database-schema-extensions)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Dependencies and Prerequisites](#dependencies-and-prerequisites)

---

## Critical Missing Features

### 1. Review and Rating System ⭐⭐⭐

**Priority:** HIGH  
**Status:** Not Implemented  
**Requirement Reference:** Project_Book.md Section 3.2.4

#### Description

A two-way review system after a completed booking:

- **Customers** can review and rate the simulator. Reviews are public and help other customers make informed decisions.
- **Hosts** can review and rate the customer who used their simulator. Customer ratings are visible to other hosts, helping them assess incoming renters before accepting a booking.

#### Required Components

- **Database Models:**
    - `SimulatorReview` model (rating, comment, customerId, simId, bookingId, createdAt) — Customer reviews a simulator
    - `CustomerReview` model (rating, comment, hostId, customerId, bookingId, createdAt) — Host reviews a customer
    - Add `avgSimRating` and `simReviewCount` fields to `Simulator` model
    - Add `avgCustomerRating` and `customerReviewCount` fields to `User` (Customer) model

- **Backend Modules:**
    - `src/review/` directory structure
        - `review.module.ts`
        - `review.controller.ts`
        - `review.service.ts`
        - `dto/create-simulator-review.dto.ts`
        - `dto/create-customer-review.dto.ts`
        - `dto/update-review.dto.ts`

- **API Endpoints:**

    _Simulator Reviews (Customer → Simulator):_
    - `POST /review/simulator` - Create a simulator review (Customer only, requires completed booking)
    - `GET /review/simulator/:simId` - Get all reviews for a simulator
    - `GET /review/simulator/by-customer/:customerId` - Get all simulator reviews written by a customer
    - `PUT /review/simulator/:id` - Update own simulator review (Customer only)
    - `DELETE /review/simulator/:id` - Delete own simulator review (Customer only)

    _Customer Reviews (Host → Customer):_
    - `POST /review/customer` - Create a customer review (Host only, requires completed booking)
    - `GET /review/customer/:customerId` - Get all reviews for a customer (visible to hosts)
    - `GET /review/customer/by-host/:hostId` - Get all customer reviews written by a host
    - `PUT /review/customer/:id` - Update own customer review (Host only)
    - `DELETE /review/customer/:id` - Delete own customer review (Host only)

    _Shared:_
    - `GET /review/:id` - Get a specific review

- **Business Rules:**
    - Only customers who completed a booking can leave a simulator review
    - Only hosts whose simulator was booked in the completed booking can leave a customer review
    - One simulator review per booking; one customer review per booking
    - Rating scale: 1-5 stars
    - Reviews must be submitted within 30 days of booking completion
    - Customer ratings (from hosts) are visible to all hosts, not to the general public
    - Hosts can reply to simulator reviews (future feature)

#### Implementation Steps

1. Add `SimulatorReview` and `CustomerReview` models to Prisma schema
2. Add rating aggregate fields to `Simulator` and `User` models
3. Run database migration
4. Create review module with NestJS CLI
5. Implement review service with business logic for both review types
6. Create DTOs with class-validator (`CreateSimulatorReviewDto`, `CreateCustomerReviewDto`, `UpdateReviewDto`)
7. Implement controller endpoints for both review flows
8. Add authorization guards (Customer guard for simulator reviews, Host guard for customer reviews)
9. Update Simulator service to recalculate average rating on review create/update/delete
10. Update User service to recalculate customer average rating on review create/update/delete
11. Write unit tests for review service
12. Write e2e tests for both review endpoints
13. Update Swagger documentation

#### Estimated Complexity: Medium-High

**Time Estimate:** 2-3 days

---

### 2. Notification System ⭐⭐⭐

**Priority:** HIGH  
**Status:** Not Implemented  
**Requirement Reference:** Project_Book.md Section 3.2.5

#### Description

Real-time notification system to alert hosts about new bookings, cancellations, and other important events. Customers should also receive notifications about booking confirmations and updates.

#### Required Components

- **Database Models:**
    - `Notification` model (id, userId, userType, title, message, type, isRead, createdAt)
    - `NotificationType` enum (BOOKING_REQUEST, BOOKING_CONFIRMED, BOOKING_CANCELLED, etc.)

- **Backend Modules:**
    - `src/notification/` directory structure
        - `notification.module.ts`
        - `notification.controller.ts`
        - `notification.service.ts`
        - `notification.gateway.ts` (WebSocket)
        - `dto/create-notification.dto.ts`
        - `dto/notification-filter.dto.ts`

- **Technologies:**
    - Socket.io for real-time notifications
    - Bull/BullMQ for notification queue (optional)
    - SSE

- **API Endpoints:**
    - `GET /notification` - Get user notifications (paginated)
    - `GET /notification/unread` - Get unread count
    - `PATCH /notification/:id/read` - Mark as read
    - `PATCH /notification/read-all` - Mark all as read
    - `DELETE /notification/:id` - Delete notification

- **WebSocket Events:**
    - `notification:new` - New notification received
    - `notification:read` - Notification marked as read

- **Notification Triggers:**
    - New booking created → Notify host
    - Booking confirmed → Notify customer
    - Booking cancelled → Notify both parties
    - New review posted → Notify host
    - Schedule updated → Notify customers with pending bookings

#### Why SSE over WebSocket?

- **Simpler Implementation:** Built on standard HTTP, no need for additional libraries
- **Automatic Reconnection:** Browser EventSource API handles reconnections automatically
- **Firewall Friendly:** Works over standard HTTP/HTTPS ports
- **Lower Overhead:** Lighter than WebSocket for one-way server→client communication
- **Perfect for Notifications:** Ideal for push-style notifications where client doesn't need to send back
- **Native Support:** NestJS has built-in SSE support with `@Sse()` decorator and RxJS Observable
- **Easier Scaling:** Simpler to load balance than WebSocket connections

#### Implementation Steps

1. Add Notification model to Prisma schema
2. Run database migration
3. Create notification module
4. Implement notification service with CRUD operations
5. Create SSE controller with stream endpoint
6. Implement notification broadcasting to connected SSE clients
7. Add notification triggers in booking/host services
8. Implement REST API controller endpoints
9. Add pagination and filtering
10. Create notification DTOs
11. Add authentication/authorization for SSE endpoint
12. Implement connection management and cleanup
13. Write integration tests
14. Update Swagger documentation

#### SSE Implementation Example

```typescript
// notification-sse.controller.ts
@Controller('notification')
export class NotificationSseController {
    @Sse('stream')
    @UseGuards(JwtAuthGuard)
    streamNotifications(@Request() req): Observable<MessageEvent> {
        const userId = req.user.id;
        const userType = req.user.type; // 'customer' or 'host'

        return this.notificationService
            .getNotificationStream(userId, userType)
            .pipe(
                map((notification) => ({
                    data: notification,
                    type: 'notification',
                })),
            );
    }
}
```

#### Estimated Complexity: Medium-High

**Time Estimate:** 2-3 days

---

### 3. Admin Management System ⭐⭐⭐

**Priority:** HIGH  
**Status:** Not Implemented  
**Requirement Reference:** Project_Book.md Sections 3.2.9-3.2.11

#### Description

Admin panel functionality for managing users, handling reports, and maintaining platform integrity.

#### Required Components

- **Database Models:**
    - `Admin` model (id, username, password, email, role, permissions)
    - `Report` model (id, reporterId, reportedId, reportedType, reason, status, createdAt)
    - `UserStatus` enum (ACTIVE, SUSPENDED, PENDING_APPROVAL, BANNED)
    - Add `status` field to User and Host models

- **Backend Modules:**
    - `src/admin/` directory structure
        - `admin.module.ts`
        - `admin.controller.ts`
        - `admin.service.ts`
        - `guards/admin.guard.ts`
        - `guards/admin-role.guard.ts`
        - `dto/approve-user.dto.ts`
        - `dto/suspend-user.dto.ts`
        - `dto/create-admin.dto.ts`

- **API Endpoints:**
    - `GET /admin/users` - List all users (paginated, filtered)
    - `GET /admin/hosts` - List all hosts (paginated, filtered)
    - `PATCH /admin/user/:id/approve` - Approve user account
    - `PATCH /admin/user/:id/suspend` - Suspend user account
    - `PATCH /admin/user/:id/activate` - Reactivate suspended account
    - `GET /admin/reports` - Get all reports
    - `GET /admin/reports/:id` - Get specific report
    - `PATCH /admin/reports/:id/resolve` - Resolve report
    - `GET /admin/statistics` - Platform statistics dashboard
    - `GET /admin/bookings` - View all bookings
    - `DELETE /admin/simulator/:id` - Remove inappropriate simulator

- **Admin Features:**
    - User/Host account approval workflow
    - Account suspension with reason
    - Report handling system
    - Platform statistics and analytics
    - Content moderation
    - Audit logging

#### Implementation Steps

1. Add Admin, Report models and status fields to Prisma schema
2. Run database migration
3. Create admin authentication strategy
4. Implement admin module structure
5. Create admin guards and decorators
6. Implement admin service methods
7. Create admin controller endpoints
8. Add role-based access control (RBAC)
9. Implement report submission endpoints
10. Create admin DTOs with validation
11. Add audit logging service
12. Write unit and integration tests
13. Create admin authentication endpoints
14. Update Swagger documentation

#### Estimated Complexity: High

**Time Estimate:** 4-5 days

---

### 4. Schedule Management for Hosts ⭐⭐⭐

**Priority:** HIGH  
**Status:** Partially Implemented (read-only)  
**Requirement Reference:** Project_Book.md Section 3.2.7

#### Description

Hosts need the ability to create, update, and manage their simulator availability schedules with pricing.

#### Current State

- Schedules can be read from database
- No creation or management endpoints exist

#### Required Components

- **API Endpoints:**
    - `POST /host/schedule/:simid` - Create schedule(s) for simulator
    - `POST /host/schedule/:simid/bulk` - Bulk create schedules (multiple days)
    - `PUT /host/schedule/:scheduleid` - Update specific schedule
    - `DELETE /host/schedule/:scheduleid` - Delete schedule (if not booked)
    - `GET /host/schedule/:simid/available` - Get available slots
    - `GET /host/schedule/:simid/unavailable` - Get booked slots

- **DTOs:**
    - `CreateScheduleDto` - Single schedule creation
    - `BulkCreateScheduleDto` - Multiple schedule creation
    - `UpdateScheduleDto` - Schedule updates
    - `ScheduleFilterDto` - Query filters

- **Business Rules:**
    - Cannot delete/modify schedules that are booked
    - Schedule times cannot overlap for same simulator
    - Price must be positive
    - End time must be after start time
    - Schedule date cannot be in the past
    - Maximum 3 months advance scheduling

- **Features:**
    - Recurring schedule templates (e.g., every Monday 9AM-5PM)
    - Holiday/blackout date management
    - Dynamic pricing by time/date
    - Bulk schedule generation

#### Implementation Steps

1. Create schedule DTOs with validation
2. Implement schedule creation in simulator service
3. Add schedule validation logic
4. Implement bulk schedule creation
5. Add schedule update endpoint with booking check
6. Add schedule deletion with validation
7. Implement recurring schedule templates
8. Add conflict detection for overlapping schedules
9. Write unit tests
10. Write integration tests
11. Update Swagger documentation

#### Estimated Complexity: Medium

**Time Estimate:** 2-3 days

---

### 5. Search and Filter System ⭐⭐⭐

**Priority:** HIGH  
**Status:** Not Implemented  
**Requirement Reference:** Project_Book.md Section 1.2, 3.2.1

#### Description

Advanced search and filtering capabilities for customers to find simulators based on location, price, type, availability, and ratings.

#### Required Components

- **API Endpoints:**
    - `GET /simulator/search` - Advanced search with filters
    - `GET /simulator/nearby` - Find simulators near location (using PostGIS)
    - `GET /simulator/filter` - Filter by multiple criteria
    - `GET /simulator/available` - Search by date/time availability

- **Query Parameters:**
    - `lat`, `long`, `radius` - Location-based search
    - `minPrice`, `maxPrice` - Price range
    - `simTypeIds[]` - Simulator types filter
    - `modIds[]` - Model filter
    - `brandIds[]` - Brand filter
    - `minRating` - Minimum rating filter
    - `startDate`, `endDate` - Availability filter
    - `sortBy` - Sort field (price, rating, distance)
    - `sortOrder` - asc/desc
    - `page`, `limit` - Pagination

- **Technologies:**
    - PostgreSQL PostGIS extension (already configured)
    - Full-text search for descriptions
    - Aggregate queries for availability

- **DTOs:**
    - `SimulatorSearchDto` - Search parameters
    - `SimulatorFilterDto` - Filter criteria
    - `NearbySearchDto` - Location search parameters

#### Implementation Steps

1. Create search and filter DTOs
2. Implement location-based search using PostGIS
3. Add full-text search for simulator descriptions
4. Implement price range filtering
5. Add type/model/brand filtering
6. Implement availability check across date ranges
7. Add rating-based filtering (after review system)
8. Implement sorting options
9. Add pagination
10. Optimize database queries with indexes
11. Write unit tests
12. Create integration tests
13. Update Swagger documentation

#### Estimated Complexity: High

**Time Estimate:** 3-4 days

---

### 6. Payment Processing System ⭐⭐

**Priority:** MEDIUM  
**Status:** Not Implemented

#### Description

Integrate payment processing for booking transactions with payment history tracking.

#### Required Components

- **Database Models:**
    - `Payment` model (id, bookingId, amount, status, method, transactionId, createdAt)
    - `PaymentStatus` enum (PENDING, COMPLETED, FAILED, REFUNDED)
    - `PaymentMethod` enum (CREDIT_CARD, DEBIT_CARD, PROMPTPAY, BANK_TRANSFER)
    - Add `paymentId` foreign key to Booking model

- **Payment Gateway Integration:**
    - Omise (Thai payment gateway) - recommended
    - Stripe (international alternative)

- **Backend Modules:**
    - `src/payment/` directory structure
        - `payment.module.ts`
        - `payment.controller.ts`
        - `payment.service.ts`
        - `omise.service.ts` (or stripe.service.ts)
        - `dto/create-payment.dto.ts`
        - `dto/payment-webhook.dto.ts`

- **API Endpoints:**
    - `POST /payment/create` - Create payment intent
    - `POST /payment/confirm` - Confirm payment
    - `POST /payment/webhook` - Payment gateway webhook
    - `GET /payment/:id` - Get payment details
    - `GET /payment/booking/:bookingId` - Get payment for booking
    - `POST /payment/:id/refund` - Process refund

- **Features:**
    - Payment intent creation
    - Payment confirmation
    - Webhook handling for async updates
    - Refund processing
    - Payment history tracking
    - Transaction receipts

#### Implementation Steps

1. Choose payment gateway (Omise recommended for Thai market)
2. Add Payment model to Prisma schema
3. Run database migration
4. Install payment gateway SDK
5. Configure payment gateway credentials
6. Create payment module structure
7. Implement payment service with gateway integration
8. Add webhook endpoint for payment notifications
9. Implement payment confirmation flow
10. Add refund processing
11. Update booking service to integrate payment
12. Create payment DTOs
13. Write unit tests with mock payment gateway
14. Test webhook handling
15. Document payment flow
16. Update Swagger documentation

#### Estimated Complexity: High

**Time Estimate:** 4-5 days

---

### 7. Facility / Amenity System ⭐⭐

**Priority:** MEDIUM  
**Status:** Not Implemented

#### Description

Allow hosts to tag their simulators with a predefined list of facilities and amenities (similar to Airbnb's "What this place offers" section). Customers can browse available facilities on a simulator's detail page and filter search results by required amenities.

#### Required Components

- **Database Models:**
    - `Facility` model (id, name, icon, category, isActive)
    - `FacilityCategory` enum (HARDWARE, GAMES_AND_CONTENT, SEATING_AND_MOTION, CONNECTIVITY, ENVIRONMENT, VENUE)
    - `SimulatorFacility` join table (simId, facilityId) — many-to-many relation

- **Backend Modules:**
    - `src/facility/` directory structure
        - `facility.module.ts`
        - `facility.controller.ts`
        - `facility.service.ts`
        - `dto/create-facility.dto.ts`
        - `dto/update-facility.dto.ts`
        - `dto/assign-facilities.dto.ts`

- **API Endpoints:**
    - `GET /facility` - List all active facilities (grouped by category)
    - `GET /facility/:id` - Get a specific facility
    - `POST /facility` - Create a facility (Admin only)
    - `PUT /facility/:id` - Update a facility (Admin only)
    - `DELETE /facility/:id` - Deactivate a facility (Admin only)
    - `POST /simulator/:id/facilities` - Assign facilities to a simulator (Host only)
    - `DELETE /simulator/:id/facilities` - Remove facilities from a simulator (Host only)
    - `GET /simulator/:id/facilities` - Get all facilities for a simulator

- **Business Rules:**
    - Only admins can create/update/delete facility definitions
    - Hosts can assign any active facility to their own simulators
    - A simulator can have unlimited facilities
- Facilities are grouped by category for display (e.g., Hardware, Games & Content, Venue)
    - Deactivating a facility hides it globally but does not remove past assignments
    - Search/filter endpoint accepts `facilityIds[]` to find simulators with specific facilities

- **Predefined Facility Examples (Simulator-Specific):**
    - **Hardware:** Multiple steering wheel options, Direct-drive wheel, H-pattern / sequential shifter, Handbrake, Pedal set (2/3 pedals), Load-cell brake pedal, VR headset available, Triple monitor setup, Ultrawide monitor, Button box / sim dashboard
    - **Games & Content:** Large game library (50+ titles), Formula / open-wheel games, Rally games, Drift games, GT / endurance racing games, Flight simulator content, iRacing subscription included, Assetto Corsa Competizione, BeamNG.drive, Microsoft Flight Simulator
    - **Seating & Motion:** Racing bucket seat, Motion platform (2-DOF), Motion platform (3-DOF / 6-DOF), Adjustable seat position, Child-friendly seat
    - **Connectivity:** Wi-Fi, Wired Ethernet, USB charging ports
    - **Environment:** Air conditioning, Soundproofed room, Private room, Shared space, Lounge / waiting area, Snacks & drinks available
    - **Venue:** Free parking, Paid parking nearby, Wheelchair accessible, Changing room, Restroom on-site, CCTV / Security cameras

#### Implementation Steps

1. Add `Facility` model and `SimulatorFacility` join table to Prisma schema
2. Add `FacilityCategory` enum to schema
3. Run database migration
4. Seed default facilities (admin task)
5. Create facility module with NestJS CLI
6. Implement facility service (CRUD + assignment logic)
7. Create DTOs with `class-validator` decorators
8. Implement facility controller endpoints
9. Add Admin guard to facility management endpoints
10. Add Host ownership guard to simulator-facility assignment endpoints
11. Extend simulator detail response to include facilities list
12. Extend search/filter endpoint to support `facilityIds[]` filter
13. Write unit tests for facility service
14. Write e2e tests for facility endpoints
15. Update Swagger documentation

#### Estimated Complexity: Medium

**Time Estimate:** 1-2 days

---

## Incomplete Implementations

### 7. Simulator CRUD Operations ⚠️

**Priority:** MEDIUM  
**Status:** Partially Implemented  
**Location:** `src/simulator/simulator.service.ts` lines 81-90

#### Current Issues

```typescript
findNearestLocation() {
  return `This action returns nearest simulator location`; // Mock
}

update(id: number, updateSimulatorDto: UpdateSimulatorDto) {
  return `This action updates a #${id} simulator`; // Mock
}

remove(id: number) {
  return `This action removes a #${id} simulator`; // Mock
}
```

#### Required Implementation

**Update Simulator:**

- Allow hosts to update their simulator details
- Support image updates (file upload handling)
- Validate ownership before update
- Update simulator types if changed

**Delete Simulator:**

- Soft delete vs hard delete consideration
- Check for active/future bookings
- Cancel or handle existing bookings
- Remove associated schedules

**Nearest Location:**

- Use PostGIS for geospatial queries
- Calculate distance from user location
- Return sorted by distance
- Support radius filtering

#### Implementation Steps

1. Implement update method with file handling
2. Add ownership validation
3. Implement soft delete with cascade rules
4. Add booking check before deletion
5. Implement nearest location using PostGIS ST_Distance
6. Write unit tests for each method
7. Update Swagger documentation

#### Estimated Complexity: Medium

**Time Estimate:** 1-2 days

---

### 8. Empty DTOs and Entities ⚠️

**Priority:** LOW  
**Status:** Incomplete

#### Files to Complete

**CreateHostDto** (`src/host/dto/create-host.dto.ts`):

```typescript
export class CreateHostDto {} // Empty
```

Should include:

- firstName, lastName
- username, password
- email, phone
- Validation decorators

**Simulator Entity** (`src/simulator/entities/simulator.entity.ts`):

```typescript
export class Simulator {} // Empty
```

Should include:

- Entity properties matching Prisma model
- Exclude decorators for sensitive fields
- Transform decorators if needed

**UpdateHostDto** (`src/host/dto/update-host.dto.ts`):

- Currently extends PartialType(CreateHostDto)
- Will auto-complete once CreateHostDto is implemented

#### Implementation Steps

1. Define CreateHostDto with validation
2. Define Simulator entity class
3. Add class-validator decorators
4. Add Swagger decorators
5. Update tests

#### Estimated Complexity: Low

**Time Estimate:** 2-4 hours

---

### 9. User Management Enhancements ⚠️

**Priority:** MEDIUM  
**Status:** Partially Implemented  
**Location:** `src/user/user.controller.ts` line 42

#### Current Issues

```typescript
@Get('all')
findAllUsers(){
  return { message: "u are admin" }; // Mock implementation
}
```

#### Required Implementation

- Implement actual user listing with pagination
- Add filtering capabilities
- Add sorting options
- Implement proper admin authorization
- Return sanitized user data (exclude passwords)

#### Additional User Features Needed

- Update user profile endpoint
- Change password endpoint
- Upload profile picture
- User activity history
- Account deletion (soft delete)

#### Implementation Steps

1. Implement findAllUsers with proper query
2. Add pagination and filtering
3. Create user profile update DTOs
4. Implement profile update endpoint
5. Add password change endpoint
6. Implement profile picture upload
7. Add proper authorization guards
8. Write unit and e2e tests
9. Update Swagger documentation

#### Estimated Complexity: Medium

**Time Estimate:** 1-2 days

---

## Database Schema Extensions

### Required Schema Changes

#### 1. Review System Tables

```prisma
// Customer reviews a simulator
model SimulatorReview {
  id          Int       @id @default(autoincrement())
  rating      Int       // 1-5 stars
  comment     String?   @db.Text
  customerId  Int
  simId       Int
  bookingId   Int       @unique // One simulator review per booking
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  customer    User      @relation("CustomerSimulatorReviews", fields: [customerId], references: [id])
  simulator   Simulator @relation(fields: [simId], references: [id])
  booking     Booking   @relation("BookingSimulatorReview", fields: [bookingId], references: [id])

  @@map("simulator_review")
}

// Host reviews a customer
model CustomerReview {
  id           Int       @id @default(autoincrement())
  rating       Int       // 1-5 stars
  comment      String?   @db.Text
  hostId       Int
  customerId   Int
  bookingId    Int       @unique // One customer review per booking
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  host         Host      @relation("HostCustomerReviews", fields: [hostId], references: [id])
  customer     User      @relation("CustomerReviewsReceived", fields: [customerId], references: [id])
  booking      Booking   @relation("BookingCustomerReview", fields: [bookingId], references: [id])

  @@map("customer_review")
}

// Add to Simulator model:
// avgSimRating      Decimal?  @db.Decimal(3, 2)
// simReviewCount    Int       @default(0)
// simulatorReviews  SimulatorReview[]

// Add to User (Customer) model:
// avgCustomerRating      Decimal?  @db.Decimal(3, 2)
// customerReviewCount    Int       @default(0)
// customerReviewsReceived CustomerReview[] @relation("CustomerReviewsReceived")
// simulatorReviews        SimulatorReview[] @relation("CustomerSimulatorReviews")

// Add to Host model:
// customerReviewsGiven  CustomerReview[] @relation("HostCustomerReviews")
```

#### 2. Notification System Tables

```prisma
enum NotificationType {
  BOOKING_REQUEST
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  NEW_REVIEW
  SCHEDULE_UPDATED
  SYSTEM_ANNOUNCEMENT
}

enum UserType {
  CUSTOMER
  HOST
  ADMIN
}

model Notification {
  id          Int               @id @default(autoincrement())
  userId      Int
  userType    UserType
  title       String            @db.VarChar(255)
  message     String            @db.Text
  type        NotificationType
  isRead      Boolean           @default(false)
  relatedId   Int?              // Related entity ID (booking, review, etc.)
  createdAt   DateTime          @default(now())

  @@index([userId, isRead])
  @@map("notification")
}
```

#### 3. Admin and Report Tables

```prisma
enum AdminRole {
  SUPER_ADMIN
  MODERATOR
  SUPPORT
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING_APPROVAL
  BANNED
}

enum ReportStatus {
  PENDING
  INVESTIGATING
  RESOLVED
  DISMISSED
}

enum ReportedType {
  USER
  HOST
  SIMULATOR
  REVIEW
}

model Admin {
  id          Int         @id @default(autoincrement())
  username    String      @unique @db.VarChar(100)
  password    String      @db.VarChar(255)
  email       String      @unique @db.VarChar(255)
  role        AdminRole   @default(MODERATOR)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())

  @@map("admin")
}

model Report {
  id            Int           @id @default(autoincrement())
  reporterId    Int
  reporterType  UserType      // Who reported
  reportedId    Int           // ID of reported entity
  reportedType  ReportedType  // What was reported
  reason        String        @db.Text
  status        ReportStatus  @default(PENDING)
  adminNote     String?       @db.Text
  createdAt     DateTime      @default(now())
  resolvedAt    DateTime?

  @@map("report")
}

// Add to User and Host models:
// status       UserStatus    @default(ACTIVE)
```

#### 4. Payment System Tables

```prisma
enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  PROMPTPAY
  BANK_TRANSFER
}

model Payment {
  id              Int            @id @default(autoincrement())
  bookingId       Int            @unique
  amount          Decimal        @db.Decimal(10, 2)
  status          PaymentStatus  @default(PENDING)
  method          PaymentMethod
  transactionId   String?        @db.VarChar(255) // Gateway transaction ID
  gatewayResponse Json?          // Store full gateway response
  paidAt          DateTime?
  refundedAt      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  booking         Booking        @relation(fields: [bookingId], references: [id])

  @@map("payment")
}

// Add to Booking model:
// payment         Payment?
```

#### 5. Facility / Amenity System Tables

```prisma
enum FacilityCategory {
  HARDWARE
  GAMES_AND_CONTENT
  SEATING_AND_MOTION
  CONNECTIVITY
  ENVIRONMENT
  VENUE
}

model Facility {
  id          Int               @id @default(autoincrement())
  name        String            @db.VarChar(100)
  icon        String?           @db.VarChar(50)  // Icon identifier (e.g. "wifi", "parking")
  category    FacilityCategory
  isActive    Boolean           @default(true)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  simulators  SimulatorFacility[]

  @@map("facility")
}

model SimulatorFacility {
  simId       Int
  facilityId  Int
  assignedAt  DateTime  @default(now())

  simulator   Simulator @relation(fields: [simId], references: [id], onDelete: Cascade)
  facility    Facility  @relation(fields: [facilityId], references: [id])

  @@id([simId, facilityId])
  @@map("simulator_facility")
}

// Add to Simulator model:
// facilities   SimulatorFacility[]
```

---

## Implementation Roadmap

### Phase 1: Core Missing Features (Week 1-2)

1. **Schedule Management** (2-3 days)
    - Enable hosts to create and manage schedules
    - Required for platform to be functional

2. **Search and Filter** (3-4 days)
    - Critical for user experience
    - Location-based search essential

3. **Complete Simulator CRUD** (1-2 days)
    - Update and delete operations
    - Nearest location search

### Phase 2: User Engagement (Week 3)

4. **Review and Rating System** (1-2 days)
    - Builds trust and engagement
    - Required for quality assurance

5. **Notification System** (2-3 days)
    - Improves user experience
    - Keeps users informed

6. **Facility / Amenity System** (1-2 days)
    - Airbnb-style amenity tagging for simulators
    - Enables amenity-based search filtering
    - Improves discoverability and host listings

### Phase 3: Platform Management (Week 4-5)

6. **Admin Management System** (4-5 days)
    - Essential for platform moderation
    - User safety and content control

7. **User Management Enhancements** (1-2 days)
    - Profile management
    - Account settings

### Phase 4: Payment Integration (Week 6)

8. **Payment Processing** (4-5 days)
    - Revenue generation
    - Professional platform requirement

### Phase 5: Polish and Testing (Week 7)

9. **Complete Empty DTOs** (2-4 hours)
10. **Comprehensive Testing** (3-4 days)
    - Unit tests for all new features
    - Integration tests
    - E2E tests
11. **Documentation Updates** (1 day)

---

## Dependencies and Prerequisites

### Technical Dependencies

- **PostGIS Extension:** Already configured, needed for location-based features
- **SSE Support:** Native in @nestjs/common (no additional packages needed)
- **Bull/BullMQ:** Optional, for notification queue
- **Payment Gateway SDK:** Install based on chosen provider (Omise/Stripe)
- **Additional npm packages:**
    - `omise` or `stripe` (for payment)
    - `bull` or `@nestjs/bull` (optional, for notification queue)
    - `rxjs` (already included with NestJS, for SSE observables)

### Feature Dependencies

1. **Review System** depends on:
    - Completed booking system ✅
    - User authentication ✅

2. **Notification System** depends on:
    - Review system (for review notifications)
    - Booking system ✅
    - SSE endpoint implementation

3. **Admin System** depends on:
    - User/Host models ✅
    - Separate admin authentication

4. **Payment System** depends on:
    - Booking system ✅
    - External payment gateway account

5. **Search System** depends on:
    - PostGIS extension ✅
    - Simulator data ✅
    - Review system (for rating filter)

---

## Testing Requirements

### Unit Tests Needed

- All service methods
- Business logic validation
- Authorization guards
- Utility functions

### Integration Tests Needed

- Complete booking flow with payment
- Review creation and retrieval
- Notification delivery
- Admin actions
- Search and filter queries

### E2E Tests Needed

- Customer booking journey
- Host simulator management
- Admin moderation workflow
- Payment processing flow

---

## Documentation Updates Required

### API Documentation

- Swagger annotations for all new endpoints
- Request/response examples
- Authentication requirements
- Error response documentation

### Developer Documentation

- Payment gateway integration guide
- SSE notification connection guide
- Admin role setup instructions
- Deployment guide updates

### User Documentation

- API usage examples
- Authentication flow
- Booking process
- Review system usage

---

## Risk Assessment

### High Risk Items

1. **Payment Integration:** Complex, third-party dependency, security critical
2. **SSE Notifications:** Connection management, client reconnection handling
3. **Location Search:** Performance with large datasets, proper indexing needed

### Medium Risk Items

4. **Admin System:** Security critical, needs thorough testing
5. **Review System:** Spam prevention, moderation required

### Low Risk Items

6. **Schedule Management:** Straightforward CRUD operations
7. **Search Filters:** Standard database queries
8. **Empty DTOs:** Simple data validation

---

## Performance Considerations

### Database Optimization

- Add indexes for frequently queried fields
- Use database views for complex aggregations
- Implement caching for search results
- Optimize PostGIS queries

### API Optimization

- Implement pagination for all list endpoints
- Add response caching where appropriate
- Use database connection pooling
- Implement rate limiting

### Scalability Planning

- SSE connection management across multiple instances (consider Redis for pub/sub)
- Payment webhook reliability
- Notification queue system
- Image storage optimization

---

## Security Considerations

### Authentication & Authorization

- Implement role-based access control (RBAC)
- Secure admin endpoints with separate authentication
- Validate ownership for all resource modifications
- Implement rate limiting on sensitive endpoints

### Payment Security

- Never store full credit card details
- Use payment gateway tokenization
- Implement webhook signature verification
- Log all payment transactions
- PCI DSS compliance considerations

### Data Protection

- Hash all passwords (already implemented with bcrypt)
- Sanitize all user inputs
- Prevent SQL injection (Prisma ORM helps)
- Implement CORS properly
- Use HTTPS in production

---

## Next Steps

### Immediate Actions

1. Review and approve this implementation plan
2. Set up project management board (e.g., Jira, Trello)
3. Create feature branches for each major component
4. Set up CI/CD pipeline if not already done
5. Configure staging environment

### Before Starting Development

1. Choose payment gateway provider
2. Set up payment gateway test account
3. Create database backup strategy
4. Set up error monitoring (e.g., Sentry)
5. Configure logging infrastructure

### Development Process

1. Create feature branch for each component
2. Write tests before implementation (TDD)
3. Code review for all changes
4. Update documentation alongside code
5. Regular integration to staging
6. User acceptance testing

---

## Conclusion

This implementation plan covers all identified gaps in the SimHouse Backend V2 codebase. The estimated total development time is approximately **5-6 weeks** for a single developer, or **3-4 weeks** with a team of 2-3 developers working in parallel on independent features.

**Note:** Using SSE for notifications instead of WebSocket reduces complexity and implementation time, making the system easier to develop and maintain.

### Priority Order for MVP

If time is constrained, implement in this order:

1. ✅ Schedule Management (critical for functionality)
2. ✅ Search and Filter (critical for usability)
3. ✅ Complete Simulator CRUD
4. ✅ Review System
5. Admin System (can phase in gradually)
6. Notification System
7. Payment Integration

### Success Criteria

- All API endpoints documented and tested
- Test coverage >80%
- All DTOs properly validated
- Security audit passed
- Performance benchmarks met
- Admin panel functional
- Payment flow tested end-to-end

---

**Document Owner:** Development Team  
**Last Updated:** February 22, 2026  
**Next Review:** After Phase 1 completion
