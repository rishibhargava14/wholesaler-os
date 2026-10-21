# Wholesaler OS - Backend API

RESTful API backend for **Wholesaler OS**, a multi-tenant business operating system designed for wholesale suppliers, FMCG distributors, and inventory managers.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (>= v18)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **File Uploads**: `multer`
- **Scheduled Tasks**: `node-cron`
- **Reporting & Exports**: `exceljs`
- **Payments & Communication**: Razorpay & WhatsApp templates (Marathi, Hindi, English)

---

## 📁 Project Structure

```
backend/
├── .env                     # Environment variables (not committed)
├── package.json             # Dependencies and lifecycle scripts
├── test-api.js              # Automated integration tests suite
├── public/
│   └── uploads/             # Uploaded product images
└── src/
    ├── app.js               # Express application configuration & routing
    ├── server.js            # Server entry point & DB connection
    ├── config/
    │   └── db.js            # MongoDB connection settings
    ├── cron/
    │   └── jobs.js          # Daily 8:00 AM alert cron jobs
    ├── middleware/
    │   ├── auth.js          # JWT authentication & company scoping
    │   └── upload.js        # Multer image upload configuration
    ├── models/
    │   ├── Company.js       # Company / tenant credentials & settings
    │   ├── Customer.js      # Customer shops, credit limits & outstanding balance
    │   ├── Ledger.js        # Customer financial debit/credit ledger
    │   ├── Order.js         # Orders, items, totals, payment & status workflows
    │   ├── PriceList.js     # Custom pricing tiers & product overrides
    │   ├── Product.js       # Products, pricing, stock & minStock alerts
    │   └── Stock.js         # Inventory movement logs (purchase/sale/return)
    ├── routes/
    │   ├── audit.js         # Multi-sheet Excel audit report export
    │   ├── auth.js          # Authentication (register, login, me, settings)
    │   ├── customers.js     # Customer management & ledger balance
    │   ├── ledger.js        # Customer payment receipt & credit clearance
    │   ├── orders.js        # Order creation, status workflow & statistics
    │   ├── pricelists.js    # Custom pricing tiers management
    │   ├── products.js      # Product CRUD & low-stock filtering
    │   ├── stock.js         # Inventory adjustments & stock logs
    │   ├── tally.js         # Tally ERP stock & price sync
    │   ├── whatsapp.js      # Multilingual WhatsApp notifications
    │   └── wholesale.js     # Public storefront catalog & lead inquiry
    └── seed/
        └── seed.js          # Sample data seeder
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wholesaler_os?directConnection=true
JWT_SECRET=wholesaler_os_super_secret_jwt_key_2026
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```powershell
cd backend
npm install
```

### 2. Seed the Database
Populates the database with demo products, price lists, customers, orders, and ledger entries:
```powershell
npm run seed
```

#### Demo Account Credentials:
- **Email**: `owner@demo.com`
- **Password**: `password123`
- **Store Subdomain**: `demo`
- **Public Store URL**: `http://localhost:3000/wholesale/demo`

### 3. Run in Development Mode (Watch)
Auto-reloads on file changes using Node's native watch engine:
```powershell
npm run dev
```

### 4. Run in Production Mode
```powershell
npm start
```

### 5. Run Automated API Tests
Runs an end-to-end integration test suite verifying all 15 API groups:
```powershell
node test-api.js
```

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new wholesaler company & user | Public |
| `POST` | `/api/auth/login` | Login with email and password | Public |
| `GET` | `/api/auth/me` | Get current logged-in company & profile | Private |
| `PUT` | `/api/auth/settings` | Update company settings & credit policies | Private |

### 📦 Products (`/api/products`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/products/create` | Create product (supports multipart image uploads) | Private |
| `GET` | `/api/products/list` | List products with `?category=` and `?lowStock=true` filters | Public/Private |
| `GET` | `/api/products/:id` | Get product details by ID | Public/Private |
| `PUT` | `/api/products/:id` | Update product details & stock | Private |
| `DELETE` | `/api/products/:id` | Delete product | Private |

### 👥 Customers (`/api/customers`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/customers/create` | Create customer with credit limits and price list | Private |
| `GET` | `/api/customers/list` | List customers with `?priceList=` filter | Public/Private |
| `GET` | `/api/customers/ledger` | Get customer ledger history & calculated outstanding balance | Public/Private |
| `GET` | `/api/customers/:id` | Get customer details by ID | Public/Private |
| `PUT` | `/api/customers/:id` | Update customer details | Private |

### 🏷️ Price Lists (`/api/pricelists`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/pricelists/create` | Create price tier (VIP/Wholesale/Retail) with custom product prices | Private |
| `GET` | `/api/pricelists/list` | List price lists for company | Public/Private |
| `GET` | `/api/pricelists/:id` | Get single price list details | Public/Private |

### 🛒 Orders (`/api/orders`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/orders/create` | Creates order applying price list rules, deducts inventory, records Stock OUT, creates Ledger debit on credit, checks credit limit | Private |
| `GET` | `/api/orders/list` | Filter orders by customer ID or status | Public/Private |
| `GET` | `/api/orders/stats` | Aggregate dashboard metrics (revenue, total orders, credit overdue, low stock) | Public/Private |
| `POST` | `/api/orders/status` | Update status (`new`, `packed`, `shipped`, `delivered`, `cancelled`). Cancellation restores stock & reverses credit debits | Private |
| `GET` | `/api/orders/:id` | Get single order with line items | Public/Private |

### 💳 Ledger & Payments (`/api/ledger`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/ledger/payment` | Record customer payment, reduce outstanding balance, and auto-clear credit orders | Private |

### 📊 Stock Management (`/api/stock`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/stock/update` | Adjust inventory levels (`in`/`out`) with reason log | Private |
| `GET` | `/api/stock/logs` | Fetch inventory movement audit trail | Public/Private |

### 🔄 Integrations & Extras
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tally/sync` | Batch synchronize stock and prices from Tally ERP by SKU |
| `POST` | `/api/whatsapp/send` | Send order confirmation, invoice, or credit reminder in Marathi, Hindi, or English |
| `GET` | `/api/audit/export` | Download complete multi-sheet Excel audit workbook (`exceljs`) |
| `GET` | `/api/wholesale/:subdomain` | Public catalog gallery for customer browsing |
| `POST` | `/api/wholesale/:subdomain/inquiry`| Submit customer inquiry from public catalog |
| `GET` | `/api/health` | Backend health check |

---

## ⏰ Cron Jobs

Configured in `src/cron/jobs.js` to execute daily at **8:00 AM (`0 8 * * *`)**:
1. **Credit Due Today Alert**: Scans orders due on current date.
2. **Low Stock Alert**: Detects products at or below their `minStock` threshold.
3. **Credit Overdue Alert**: Identifies customer balances exceeding agreed `creditDays`.
