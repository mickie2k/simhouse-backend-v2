# SimHouse Backend - Setup and Development Instructions

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd simhouse-backend-v2
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

## Environment Configuration

1. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

2. Configure the following environment variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/simhouse?schema=public"

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Application
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001
```

## Database Setup

This project uses Prisma as the ORM.

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Run Migrations

```bash
npx prisma migrate dev
```

### 3. Seed the Database (Optional)

```bash
npx prisma db seed
```

### 4. View Database with Prisma Studio

```bash
npx prisma studio
```

### Common Prisma Commands

- **Create a new migration**: `npx prisma migrate dev --name migration_name`
- **Reset database**: `npx prisma migrate reset`
- **Check migration status**: `npx prisma migrate status`
- **Deploy migrations**: `npx prisma migrate deploy`

## Running the Application

### Development Mode

```bash
npm run start:dev
# or
yarn start:dev
```

The server will start at `http://localhost:3000` with hot-reload enabled.

### Production Mode

```bash
# Build the project
npm run build

# Start the production server
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## Development Workflow

### Code Structure

The project follows NestJS modular architecture:

- **`src/auth/`**: Authentication modules (customer & host)
  - JWT authentication
  - Google OAuth integration
  - Guards and strategies
  
- **`src/booking/`**: Booking management
  
- **`src/host/`**: Host management and operations
  
- **`src/simulator/`**: Simulator management
  
- **`src/user/`**: User management
  
- **`src/prisma/`**: Prisma service and module
  
- **`src/common/`**: Shared utilities and filters

### Creating a New Module

```bash
nest g module <module-name>
nest g controller <module-name>
nest g service <module-name>
```

### Adding a New Entity

1. Update `prisma/schema.prisma` with the new model
2. Create migration: `npx prisma migrate dev --name add_entity_name`
3. Generate Prisma client: `npx prisma generate`
4. Create DTOs in the module's `dto/` folder
5. Implement service methods
6. Add controller endpoints

## Testing

### Unit Tests

```bash
npm run test
# or
yarn test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

### Watch Mode

```bash
npm run test:watch
```

## API Documentation

The API is documented using Swagger/OpenAPI.

### Access Swagger UI

Once the application is running, access the API documentation at:

```
http://localhost:3000/api
```

See [SWAGGER.md](./SWAGGER.md) for more details on API documentation.

## Authentication

This project implements dual authentication systems:

- **Customer Authentication**: For end users
- **Host Authentication**: For property hosts

Both systems support:
- Local authentication (email/password)
- Google OAuth
- JWT with refresh tokens

See [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) for detailed authentication flow.

## Security

Security best practices are implemented including:
- JWT token management
- Password hashing
- CORS configuration
- Rate limiting
- Input validation

See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

## Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in `.env`
   - Ensure database exists

2. **Prisma client errors**
   - Run `npx prisma generate`
   - Clear node_modules and reinstall

3. **Port already in use**
   - Change PORT in `.env`
   - Kill process using the port: `npx kill-port 3000`

4. **Migration conflicts**
   - Check migration status: `npx prisma migrate status`
   - Reset if needed: `npx prisma migrate reset`

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport.js Documentation](http://www.passportjs.org/docs)

## Support

For questions or issues, please refer to the project documentation or contact the development team.
