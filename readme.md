# 🍕 Pizza Delivery App - Auth Service

This is the **Authentication Microservice** for the Pizza Delivery App.
It handles user registration, login, role management, and authentication-related operations.

<!-- --- -->

<!-- ## 📁 Project Structure

```
src/
🔼📝 config/         # Environment and DB config
🔼📜 controllers/    # Route handlers
🔼📏 routes/         # Express route definitions
🔼📊 services/       # Business logic (e.g., user registration)
🔼📄 models/         # TypeORM entities / schemas
🔼🔧 utils/          # Error handling, helpers
🔺 server.ts       # Entry point
``` -->

---

## ⚙️ Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** for API
- **PostgreSQL** as the database (via Docker)
- **TypeORM** for database ORM
- **Jest** & **Supertest** for testing
- **Prettier** & **ESLint** for code formatting & linting
- **Husky** & **Lint-staged** for Git hooks
- **Dotenv** for environment configuration

---

## 📦 Scripts

| Script                 | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start the server with `nodemon` |
| `npm start`            | Start the production server     |
| `npm run lint:check`   | Check code with ESLint          |
| `npm run lint:fix`     | Auto-fix lint issues            |
| `npm run format:check` | Check formatting with Prettier  |
| `npm run format:fix`   | Auto-fix formatting issues      |
| `npm test`             | Run test suites using Jest      |

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

### 4. Run PostgreSQL with Docker

```bash
docker-compose up -d
```

Or manually:

```bash
docker run --name pg-auth -e POSTGRES_USER=root -e POSTGRES_PASSWORD=root -e POSTGRES_DB=auth-service -p 5432:5432 -d postgres
```

### 5. Start the Server

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

<!-- --- -->

<!-- ## ✨ Features

* 🔐 Secure password hashing
* 📾 Custom error handling (`HttpError`, `ValidationError`)
* 📜 Typed request validation
* 👯‍♂️ Role-based access support (`admin`, `customer`, `manager`)
* 🧰 Fully tested endpoints -->

<!-- --- -->

<!-- ## 📄 License

[ISC License](LICENSE) -->

<!-- --- -->

## 👨‍💼 Author

**Roshan Kumar**
[GitHub](https://github.com/roshan798) • [LinkedIn](https://www.linkedin.com/in/roshan-kumar7989/)

---

> _This microservice is part of a larger Pizza Delivery App system._
