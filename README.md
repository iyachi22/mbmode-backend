# 🛍️ mbmode Backend API

Node.js/Express backend API for the mbmode e-commerce platform.

## 🚀 Features

- **Product Management**: CRUD operations for products, categories, and variants
- **Order Processing**: Complete order management with PDF receipts
- **User Authentication**: JWT-based auth for customers and admins
- **File Upload**: Image upload for products and banners
- **Email Notifications**: Order confirmations and notifications
- **Admin Dashboard**: Complete admin panel with analytics
- **Multi-language Support**: Arabic, French, and English
- **Shipping Management**: Dynamic shipping rates by wilaya

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Email**: Nodemailer
- **PDF Generation**: PDFKit
- **Validation**: Express Validator

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mbmode-backend.git
   cd mbmode-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Create MySQL database
   # Run migrations (if any)
   npm run sync-db
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `127.0.0.1` |
| `DB_PORT` | Database port | `3306` |
| `DB_NAME` | Database name | `mb13_store` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | `` |
| `JWT_SECRET` | JWT secret key | Required |
| `UPLOAD_DIR` | Upload directory | `./uploads` |
| `CORS_ORIGIN` | Allowed origins | `*` |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/admin/login` - Admin login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/admin/products` - Create product (Admin)
- `PUT /api/admin/products/:id` - Update product (Admin)
- `DELETE /api/admin/products/:id` - Delete product (Admin)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id/receipt` - Download receipt PDF
- `GET /api/admin/orders` - Get all orders (Admin)
- `PUT /api/admin/orders/:id` - Update order status (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/admin/categories` - Create category (Admin)
- `PUT /api/admin/categories/:id` - Update category (Admin)

### Contact
- `GET /api/contact` - Get contact information
- `PUT /api/admin/contact` - Update contact info (Admin)

## 🗂️ Project Structure

```
mbmode-backend/
├── 📁 config/           # Configuration files
├── 📁 middleware/       # Express middleware
├── 📁 models/          # Sequelize models
├── 📁 routes/          # API routes
├── 📁 utils/           # Utility functions
├── 📁 uploads/         # File uploads
├── 📁 temp/            # Temporary files
├── 📄 server.js        # Main server file
└── 📄 package.json     # Dependencies
```

## 🚀 Deployment

### cPanel Hosting
1. Upload files to your cPanel directory
2. Set up Node.js app in cPanel
3. Configure environment variables
4. Install dependencies: `npm install --production`
5. Start the application

### Environment Setup
```bash
# Production environment
NODE_ENV=production
PORT=3000
DB_HOST=your-cpanel-db-host
CORS_ORIGIN=https://yourdomain.com
```

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- File upload restrictions
- SQL injection prevention (Sequelize ORM)

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run sync-db` - Sync database models

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@mbmode.com or create an issue on GitHub.