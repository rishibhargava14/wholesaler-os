# Wholesaler OS

Wholesaler OS is a wholesale business management application with:

- A Next.js frontend
- An Express/Mongoose backend
- MongoDB persistence
- Product, customer, order, stock, ledger, price-list, settings, and public catalog flows

## Requirements

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB Atlas connection string

## Project structure

```text
wholesaler-os/
├── backend/     Express API and MongoDB models
├── frontend/    Next.js application
└── README.md
```

## Configure the backend

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wholesaler_os
JWT_SECRET=replace-this-with-a-long-random-secret
NODE_ENV=development
```

For MongoDB Atlas, replace `MONGODB_URI` with the Atlas connection string. Keep the
connection string private and do not commit `.env` files.

## Configure the frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

If the backend runs on another host or port, change this URL accordingly.

## Install dependencies

Open a terminal in each project folder and install dependencies:

```powershell
cd backend
npm install
```

```powershell
cd frontend
npm install
```

## Load demo data

The seed script creates a complete demo workspace containing:

- 1 company
- 7 products
- 6 customers
- 2 price lists
- 6 orders
- Stock movement logs
- Customer ledger entries
- Paid, credit, shipped, delivered, low-stock, and overdue examples

Run this from the repository root:

```powershell
cd backend
npm run seed
```

> Warning: `npm run seed` clears the existing Company, Product, Customer,
> PriceList, Order, Stock, and Ledger collections before inserting demo data.
> Use it only for local/demo environments.

## Start the application

Start the backend in one terminal:

```powershell
cd backend
npm run dev
```

The API runs at:

```text
http://localhost:5000/api
```

Start the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

## Demo owner credentials

After running the seed command, use these credentials on the login page:

```text
Email: owner@demo.com
Password: password123
```

The seeded public store uses the `demo` subdomain:

```text
http://localhost:3000/wholesale/demo
```

The backend public catalog endpoint is:

```text
GET http://localhost:5000/api/wholesale/demo
```

## Useful endpoints

```text
GET  /api/health
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

GET    /api/products/list
POST   /api/products/create
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id

GET  /api/customers/list
POST /api/customers/create
GET  /api/customers/:id
GET  /api/customers/ledger
PUT  /api/customers/:id

GET  /api/orders/list
POST /api/orders/create
GET  /api/orders/stats
POST /api/orders/status

GET  /api/pricelists/list
POST /api/pricelists/create
GET  /api/pricelists/:id

GET  /api/stock/logs
POST /api/stock/update
POST /api/ledger/payment
```

Protected endpoints require:

```text
Authorization: Bearer <access-token>
```

## Verify the seeded dashboard

1. Start MongoDB.
2. Run `npm run seed` from `backend`.
3. Start the backend.
4. Start the frontend.
5. Log in with `owner@demo.com` and `password123`.
6. Open the dashboard.

The dashboard should show order totals, revenue, outstanding credit, low-stock
products, overdue credit, customers, and recent orders from MongoDB.

## Production notes

- Use a strong `JWT_SECRET`.
- Use an explicit frontend origin in the backend CORS configuration.
- Never expose MongoDB credentials in frontend environment variables.
- Do not run the seed script against production data.
- Replace the demo password before deploying.
