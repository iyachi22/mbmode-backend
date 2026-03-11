# 🚀 mbmode Backend - Node.js API Setup

## What I Created

A clean Node.js + Express API that connects to your existing MySQL database. No data loss - it uses the same database as your Laravel app!

## Files Created

```
mbmode-backend/
├── server.js              # Main server file
├── package.json           # Dependencies
├── .env.example          # Environment variables template
├── config/
│   └── database.js       # Database connection
├── models/               # Sequelize models (map to your tables)
│   ├── Product.js
│   ├── Category.js
│   └── index.js
└── routes/               # API endpoints
    └── products.js       # Product routes
```

## Quick Start

### 1. Install Dependencies

```bash
cd mbmode-backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=mb13_store          # Your Laravel database name
DB_USER=root                 # Your database user
DB_PASSWORD=                 # Your database password
```

### 3. Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

### 4. Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Get featured products
curl http://localhost:3000/api/products/featured

# Get all products
curl http://localhost:3000/api/products

# Get single product
curl http://localhost:3000/api/products/1
```

## API Endpoints (So Far)

### Products
- `GET /api/products` - List products with filters
  - Query params: `category`, `search`, `featured`, `min_price`, `max_price`, `sort`, `page`, `limit`
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product

## Next Steps

I need to create:
1. ✅ Products API (DONE)
2. ⏳ Categories API
3. ⏳ Banners API
4. ⏳ Orders API
5. ⏳ Auth API (login/register)
6. ⏳ Admin API (manage products, orders, etc.)

## Advantages Over Laravel

- ✅ No build process issues
- ✅ Faster performance
- ✅ Easier to deploy
- ✅ Same database, no data migration needed
- ✅ Clean, simple code
- ✅ Works with your existing data

## Database Connection

The API connects to your existing MySQL database using Sequelize ORM. It reads from the same tables that Laravel created, so all your products, orders, and users are available immediately!

Ready to continue? Let me know and I'll create the remaining routes!
