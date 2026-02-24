# SimHouse Backend V2 - Agent Guidelines

This document provides essential information for AI agents working on the SimHouse Backend V2 repository.

## 1. Project Overview

- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **ORM:** Prisma (`prisma/schema.prisma`)
- **Documentation:** Swagger/OpenAPI

## 2. Git Workflow

- Create feature branches: `feature/short-description`.
- Fix branches: `fix/short-description`.
- Auto-commit after each logical change with a clear, concise message.
- Commit messages should be clear and concise.
- **Pull Requests:** When a task is complete, verify all tests pass and then create a Pull Request (PR) to merge changes into the main branch. Use the `gh` tool if available.

## 3. Build & Test Commands

### Core Commands

- **Build:** `npm run build`
- **Start (Dev):** `npm run start:dev`
- **Lint:** `npm run lint` (ESLint)
- **Format:** `npm run format` (Prettier)

### Testing

- **Run All Unit Tests:** `npm run test`
- **Run a Single Test File:**
    ```bash
    npm run test -- path/to/file.spec.ts
    ```
- **Run a Specific Test Case (by name):**
    ```bash
    npm run test -- -t "should create a user"
    ```
- **Run E2E Tests:** `npm run test:e2e`
- **Test Coverage:** `npm run test:cov`

## 4. Code Style & Conventions

### General

- **Formatting:** Adhere to Prettier configuration (single quotes, semicolons, 2-space indentation).
- **Naming:**
    - Classes: `PascalCase` (e.g., `UsersController`)
    - Variables/Functions: `camelCase` (e.g., `findUserById`)
    - Files: `kebab-case` with type suffix (e.g., `users.controller.ts`, `create-user.dto.ts`)
    - Interfaces: `I` prefix is NOT used (e.g., `User`, not `IUser`).

### NestJS Architecture

- **Modules:** Organize code into feature modules (`@Module`).
- **Dependency Injection:**
    - Use constructor injection.
    - Use `@Injectable()` for services.
    - Prefer interface-based DI where applicable.
- **Controllers:**
    - Keep thin; delegate logic to services.
    - Use standard HTTP decorators (`@Get`, `@Post`, etc.).
    - Apply Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`).
- **Services:**
    - Contain all business logic.
    - Handle data persistence via Repositories or Prisma Client.
- **DTOs:**
    - Use `class-validator` decorators (`@IsString`, `@IsEmail`).
    - Use `class-transformer` if transformation is needed.

### Error Handling

- Use standard `HttpException` or subclasses (e.g., `NotFoundException`, `BadRequestException`).
- A global `GenericExceptionFilter` is in place; ensure custom exceptions play nicely with it.

## 5. Specific Rules (from Copilot Instructions)

### Dependency Injection

- Inject dependencies via constructor.
- Use `@Injectable()` for all providers.

### Database (Prisma)

- Define schema in `prisma/schema.prisma`.
- Use the generated Prisma Client for DB operations.
- **Note:** The `copilot-instructions.md` mentions TypeORM, but `package.json` and file structure indicate **Prisma**. Follow the codebase (Prisma) over the generic instructions if they conflict.

### API Development

- **Validation:** Global `ValidationPipe` is enabled with `whitelist: true`. All input DTOs must have validation decorators.
- **Swagger:** All endpoints must be documented with `@nestjs/swagger` decorators.

### Testing Strategy

- **Unit Tests:** Co-locate `.spec.ts` files with source files. Mock dependencies using `jest.fn()` or Nest's testing utilities.
- **E2E Tests:** Located in `test/` directory.

## 6. External Libraries (Context7)

- When implementing features requiring specific library knowledge (e.g., AWS SDK, Passport), verify the correct usage and version compatibility.
- If unsure about a library's API, consult documentation or specific agent tools if available.
