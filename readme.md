# 🍕 Pizza Delivery App - Auth Service

This is the **Authentication Microservice** for the Pizza Delivery App.
It handles user registration, login, role management, and authentication-related operations.

<!--
## 📁 Project Structure

```
app.spec.ts                # Example test file
eslint.config.mjs          # ESLint configuration
jest.config.js             # Jest configuration
package.json               # Project manifest
readme.md                  # Project documentation
tsconfig.json              # TypeScript configuration
.prettierrc                # Prettier configuration
certs/                     # SSL certificates
  privateKey.pem
  publicKey.pem
docker/
  dev/
    Dockerfile             # Dockerfile for development
logs/                      # Log files
  combined.log
  error.log
scripts/                   # Utility scripts
  generatePrivateKey.mjs   # Script to generate private key
src/                       # Source code
  app.ts                   # Express app
  server.ts                # Entry point
  utils.ts                 # Utility functions
  config/                  # Configuration files
  controllers/             # Route handlers
  entity/                  # TypeORM entities
  migration/               # DB migrations
  routes/                  # Express routes
  services/                # Business logic
  types/                   # Type definitions
  validators/              # Input validators
tests/                     # Test files
  users/
  utils/
```
-->

---

## ⚙️ Tech Stack

- **Node.js** (>=22.10.0) with **TypeScript** (strict mode)
- **Express.js** for API
- **PostgreSQL** as the database (via Docker)
- **TypeORM** for database ORM
- **Jest** & **Supertest** for testing
- **Prettier** & **ESLint** for code formatting & linting
- **Husky** & **Lint-staged** for Git hooks
- **Dotenv** for environment configuration

---

## 📦 Scripts

| Script                 | Description                       |
| ---------------------- | --------------------------------- |
| `npm run dev`          | Start the server with ts-node-dev |
| `npm start`            | Start the production server       |
| `npm run build`        | Compile TypeScript to JavaScript  |
| `npm run lint:check`   | Check code with ESLint            |
| `npm run lint:fix`     | Auto-fix lint issues              |
| `npm run format:check` | Check formatting with Prettier    |
| `npm run format:fix`   | Auto-fix formatting issues        |
| `npm test`             | Run test suites using Jest        |
| `npm run start:DB`     | Start PostgreSQL DB via Docker    |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/roshan798/pizza-delivery-app-auth-service.git
cd pizza-delivery-app-auth-service
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create environment files:

```bash
cp .env.dev.example .env.dev
cp .env.prod.example .env.prod
cp .env.test.example .env.test
```

Update them with your Postgres credentials and configs.

### 4. Download PostgreSQL Docker Image (if not already present)

```bash
docker pull postgres
```

### 5. Start PostgreSQL with Docker

You can use the provided npm script:

```bash
npm run start:DB
```

Or manually:

```bash
docker run --name pg-auth -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root -e POSTGRES_DB=auth-service -p 5432:5432 -d postgres
```

### 6. Generate Private/Public Keys (if needed)

```bash
node scripts/generatePrivateKey.mjs
```

This will generate the necessary keys in the `certs/` directory.

### 7. Build the Project

```bash
npm run build
```

### 8. Start the Server

```bash
# For development
npm run dev

# For production
NODE_ENV=production npm start
```

---

## 🧪 Running Tests

```bash
npm test
```

Tests use a separate `.env.test` database. Ensure it's configured before running tests.

---

## 🧰 Linting & Formatting

```bash
# Check for issues
npm run lint:check
npm run format:check

# Auto-fix issues
npm run lint:fix
npm run format:fix
```

---

## 🛡️ Pre-commit Hooks

Husky and lint-staged are configured to automatically format and lint staged files before each commit.

---

## 👨‍💼 Author

**Roshan Kumar**  
[GitHub](https://github.com/roshan798) • [LinkedIn](https://www.linkedin.com/in/roshan-kumar7989/)

---

> _This microservice is part of a larger Pizza Delivery App system._
