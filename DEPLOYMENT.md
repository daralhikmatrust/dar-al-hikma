# Deployment Guide for Dar Al Hikma Trust Website

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Supabase recommended)
- Razorpay account with API keys
- Cloudinary account (for media uploads)
- Email service (for sending receipts)

## Environment Variables

### Backend (.env file in `backend/` directory)

```env
# Server
PORT=5000
NODE_ENV=production

# Database (Supabase PostgreSQL)
DATABASE_URL=your_supabase_connection_string

# JWT
JWT_SECRET=your_strong_jwt_secret_key
JWT_EXPIRE=7d

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_FROM=Dar Al Hikma Trust <noreply@daralhikma.org>

# CORS (for production)
FRONTEND_URL=https://your-domain.com
```

### Frontend (.env file in `frontend/` directory)

```env
VITE_API_URL=https://your-backend-api.com/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Deployment Steps

### 1. Backend Deployment

#### Option A: Using Vercel/Railway/Render

1. Connect your GitHub repository
2. Set environment variables in the platform dashboard
3. Set build command: `cd backend && npm install && npm run build` (if needed)
4. Set start command: `cd backend && npm start`
5. Deploy

#### Option B: Using VPS (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd anu-port/backend

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2

# Create .env file with all environment variables
nano .env

# Start application with PM2
pm2 start server.js --name "dah-backend"
pm2 save
pm2 startup
```

### 2. Frontend Deployment

#### Option A: Using Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend directory: `cd frontend`
3. Run: `vercel`
4. Set environment variables in Vercel dashboard
5. Deploy: `vercel --prod`

#### Option B: Using Netlify

1. Connect GitHub repository
2. Set build command: `cd frontend && npm install && npm run build`
3. Set publish directory: `frontend/dist`
4. Add environment variables in Netlify dashboard
5. Deploy

#### Option C: Using VPS with Nginx

```bash
# Build frontend
cd frontend
npm install
npm run build

# Install Nginx
sudo apt-get install nginx

# Copy build files
sudo cp -r dist/* /var/www/html/

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Database Setup

1. Create a Supabase project
2. Run Prisma migrations:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

3. Seed initial data (optional):
```bash
npm run seed
```

### 4. SSL Certificate (HTTPS)

Use Let's Encrypt with Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Post-Deployment Checklist

- [ ] Verify backend API is accessible
- [ ] Verify frontend is loading correctly
- [ ] Test Razorpay payment integration
- [ ] Test admin login functionality
- [ ] Verify email receipts are being sent
- [ ] Check CORS settings
- [ ] Verify database connections
- [ ] Test file uploads (if using media features)
- [ ] Set up monitoring (PM2 monitoring or external service)
- [ ] Configure backup strategy for database

## Admin Access

1. Create an admin user through the database or seed script
2. Access admin panel at: `https://your-domain.com/admin/login`
3. Default admin credentials should be changed immediately

## Troubleshooting

### Backend Issues
- Check PM2 logs: `pm2 logs dah-backend`
- Verify environment variables are set correctly
- Check database connection string
- Verify Razorpay keys are correct

### Frontend Issues
- Check browser console for errors
- Verify API URL is correct
- Check CORS configuration
- Verify Razorpay key is set

### Payment Issues
- Verify Razorpay account is active
- Check webhook configuration in Razorpay dashboard
- Verify payment verification logic

## Security Recommendations

1. Use strong JWT secrets
2. Enable HTTPS only
3. Set secure CORS origins
4. Regularly update dependencies
5. Use environment variables for all secrets
6. Enable rate limiting
7. Set up firewall rules
8. Regular security audits

## Monitoring

- Set up error tracking (Sentry recommended)
- Monitor server resources
- Set up uptime monitoring
- Configure log rotation
- Set up database backups

## Support

For issues or questions, contact the development team.

