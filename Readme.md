# IMF Gadget API

The Impossible Missions Force (IMF) Gadget API is a secure and mission-critical RESTful API built using Node.js, Express, Prisma ORM, and PostgreSQL. It helps manage a top-secret gadget inventory for field agents, complete with authentication, soft deletion, codename generation, and self-destruct capabilities.

## 🚀 Features

- 📦 Manage gadget inventory with CRUD operations
- 🕶️ Unique random codenames for gadgets
- 📈 Mission success probability included in gadget listings
- 🗑️ Soft delete (decommission) gadgets
- 💥 Self-destruct sequence with confirmation code
- 🔐 JWT-based authentication and authorization
- 🔎 Filter gadgets by status

## 🛠️ Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Set up PostgreSQL and create a database
4. Create a `.env` file with your database URL and JWT secret:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/imf_gadgets"
JWT_SECRET="your_jwt_secret"
```

5. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

6. Start the server:

```bash
npm run dev
```

## 📡 API Endpoints

- `POST /login` - Get JWT token (send username and password)
- `POST /register` - Register a new user account
- `GET /gadgets` - List all gadgets (optional `?status=` filter)
- `POST /gadgets` - Add new gadget (requires `name`)
- `PATCH /gadgets/:id` - Update gadget
- `DELETE /gadgets/:id` - Decommission gadget (soft delete)
- `POST /gadgets/:id/self-destruct` - Trigger self-destruct (requires confirmation code)

### 💣 Self-Destruct Sequence

To safely trigger a gadget's self-destruct sequence:

1. First, generate a confirmation code:

```bash
POST /gadgets/:id/generate-confirmation
```
This returns a confirmation code.


2. Then, confirm the self-destruct:

```bash
POST /gadgets/:id/self-destruct Body: { "confirmation": "123456" }
```

## 🧪 Tech Stack

- **Backend**: Node.js, Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JSON Web Tokens (JWT)
- **Dev Tools**: Nodemon


## Authentication

All endpoints except `/login`, `/register` and `/docs` require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```
