# 🚀 Deploy Backend to cPanel

## Quick Deployment Steps

### 1. Update Backend Repository
```bash
# Make sure all changes are committed and pushed
git add .
git commit -m "Update backend for production deployment"
git push origin main
```

### 2. Update on cPanel
1. **Go to cPanel → Git Version Control**
2. **Find your backend repository** 
3. **Click "Pull or Deploy"** to get latest code

### 3. Configure Environment
1. **Go to cPanel File Manager**
2. **Navigate to your API directory** (`/home/sfbnfyhh/api/`)
3. **Copy `.env.production.example` to `.env`**:
   ```bash
   cp .env.production.example .env
   ```
4. **Edit `.env` file** and verify these settings:

```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sfbnfyhh_mbstore
DB_USER=sfbnfyhh_user
DB_PASSWORD=(Ua)NSS3mz
JWT_SECRET=mbmode-production-jwt-secret-2026-change-this-secure-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://mbmodetlm.com,https://www.mbmodetlm.com,http://localhost:5173,http://localhost:3000
```

### 4. Install Dependencies & Restart
1. **In cPanel Terminal** (or Node.js interface):
   ```bash
   cd /home/sfbnfyhh/api
   npm install --production
   ```

2. **Restart Node.js App**:
   - Go to cPanel → Node.js
   - Stop and Start your application

### 5. Test API Endpoints
Test these URLs in your browser:
- `https://mbmodetlm.com/api/health`
- `https://mbmodetlm.com/api/products`
- `https://mbmodetlm.com/api/categories`

### 6. Test Frontend Connection
```bash
cd mbmode-frontend
npm run dev
```
Open `http://localhost:5173` - should now load data from production API.

## Troubleshooting

### If API returns 404:
- Check Node.js app is running in cPanel
- Verify startup file is set to `server.js`
- Check application root path

### If CORS errors:
- Verify `CORS_ORIGIN` includes `http://localhost:5173`
- Restart Node.js app after changing `.env`

### If database errors:
- Verify database credentials in `.env`
- Check if database `sfbnfyhh_mbstore` exists
- Test database connection in cPanel phpMyAdmin