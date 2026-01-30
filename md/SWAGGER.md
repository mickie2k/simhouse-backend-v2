# Swagger/OpenAPI Documentation

## Overview
The SimHouse API is fully documented using Swagger/OpenAPI 3.0 specification. This provides interactive API documentation that allows you to explore and test all endpoints directly from your browser.

## Accessing Swagger UI

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api
```

## Features

### 1. **Interactive API Explorer**
- Browse all available endpoints organized by tags
- View detailed request/response schemas
- Test endpoints directly from the browser

### 2. **Authentication**
The API supports multiple authentication methods:
- **JWT Bearer Token**: Add your JWT token for bearer authentication
- **Cookie Authentication**: 
  - `access_token`: Primary authentication cookie
  - `refresh_token`: Token refresh cookie

### 3. **API Tags**
Endpoints are organized into the following categories:
- **auth**: Authentication and user session management
- **user**: User profile and management
- **booking**: Customer booking operations
- **host**: Host and simulator management
- **simulator**: Simulator catalog and details

## Using Authentication in Swagger

### Method 1: Cookie Authentication (Recommended)
1. First, login using the `/auth/login` endpoint
2. The cookies will be automatically set in your browser
3. Subsequent requests will use these cookies automatically

### Method 2: Bearer Token
1. Login using the `/auth/login` endpoint
2. Copy the access token from the response
3. Click the "Authorize" button at the top of the Swagger UI
4. Paste your token in the "JWT-auth" field
5. Click "Authorize" and then "Close"
6. All authenticated endpoints will now include your token

## API Workflow Examples

### Customer Booking Flow
1. **Register**: `POST /auth/register`
2. **Login**: `POST /auth/login`
3. **Browse Simulators**: `GET /simulator`
4. **Create Booking**: `POST /booking`
5. **View Bookings**: `GET /booking`
6. **Cancel Booking**: `DELETE /booking/{bookingid}`

### Host Management Flow
1. **Login**: `POST /auth/login`
2. **Upload Simulator**: `POST /host/simulator`
3. **View Bookings**: `GET /host/booking/{simid}`
4. **Confirm Booking**: `POST /host/booking/{simid}/{bookingid}/confirm`

## Request/Response Examples

All endpoints include:
- **Request schemas**: See exactly what fields are required
- **Response examples**: Understand the data structure returned
- **HTTP status codes**: Know what to expect for success and error cases

## Development

### Adding New Endpoints
When adding new endpoints, include the following decorators:

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('your-tag')
@ApiBearerAuth('JWT-auth')
@Controller('your-controller')
export class YourController {
  
  @ApiOperation({ summary: 'Description of endpoint' })
  @ApiResponse({ status: 200, description: 'Success message' })
  @ApiResponse({ status: 404, description: 'Not found message' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    // implementation
  }
}
```

### Adding DTO Documentation
For DTOs, use `@ApiProperty` decorators:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class YourDto {
  @ApiProperty({
    description: 'Field description',
    example: 'example value',
  })
  @IsString()
  fieldName: string;
}
```

## Configuration

The Swagger configuration is located in `src/main.ts` and includes:
- API title and description
- Version information
- Authentication schemes
- Tag descriptions

## Additional Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
