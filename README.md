# EVE Board

## 🧩 Frontend — `eve-board-frontend`

### 🌐 Tech Stack
- React (Vite + TypeScript)
- React Router
- Axios / React Query
- CSS / SCSS Modules (no Tailwind)
- JWT / OAuth Authentication
- i18next (for localization, if needed)

### 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build the project
npm run build

# Preview the production build
npm run preview
```

### 🔐 Authentication
- EVE Online, Discord, or email login
- Token storage in localStorage
- Role-based routing protection through Guards

### 📦 Features
- Viewing, filtering, and sorting orders
- Order detail page
- Ability to accept, reject, or complete orders
- User order history
- Notifications (toasts/alerts)
- Localization (i18n-ready)

### 📁 Project Structure

```
src/
├── components/
├── pages/
├── hooks/
├── utils/
├── store/
└── styles/
```

### 🔄 API Integration
- Using Axios or React Query to interact with the backend
- RESTful API calls for orders, users, and transactions
- Authentication tokens handled with JWT

---

## 🧩 Backend — `eve-board-backend`

### 🌐 Tech Stack
- NestJS (TypeScript)
- PostgreSQL (with Prisma ORM)
- JWT / OAuth2 Authentication (EVE Online, Discord)
- REST API (GraphQL may be added later)
- Validation, Guards, and Roles management

### 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start the development server
npm run start:dev

# Build the project
npm run build

# Run migrations and seed database
npm run migrate
npm run seed
```

### 🔐 Authentication
- EVE Online or Discord login via OAuth2
- JWT tokens used for authentication and authorization
- Guards for route protection based on roles (user, admin, etc.)

### 📦 Features
- CRUD operations for orders, users, and transactions
- Ability to create, update, and delete orders
- Handling of transactions, payouts, and user balances (ISK)
- Order status management (active, taken, completed, canceled)
- Logging and history of actions (user activities, order updates)

### 📁 Project Structure

```
src/
├── common/
├── modules/
│   ├── users/
│   ├── orders/
│   ├── transactions/
│   ├── auth/
│   └── ...
├── config/
└── utils/
```

### 🔄 Database & ORM
- PostgreSQL used as the database
- Prisma ORM for database access
- Migrations and seeds handled by Prisma

### 📈 DevOps & Deployment
- Docker for containerization
- Hosted on Railway / Render / Vercel / Supabase
- Continuous integration with GitHub Actions

---

### 🛠️ Development Notes

- **Frontend:** 
  - Uses Vite for fast development builds.
  - React Router for handling routing in a single-page application (SPA).
  - Components are styled using CSS/SCSS Modules.
  
- **Backend:** 
  - NestJS is used to build the REST API.
  - PostgreSQL stores all persistent data (users, orders, transactions).
  - JWT authentication ensures secure access control.

