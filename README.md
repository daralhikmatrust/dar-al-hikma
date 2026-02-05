# Dar Al Hikma Trust - Full Stack Web Application

A complete, production-ready full-stack web application for Dar Al Hikma Trust with modern UI, donation management, and comprehensive admin features.

## 🚀 Features

### Public Features
- **Home Page**: Mission, vision, hero sections, featured projects
- **About**: Trust information, values, and impact
- **Projects**: Browse ongoing/completed projects with filters
- **Faculties**: Engineering, Medical, Education, Welfare
- **Gallery**: Photo and video gallery
- **Hall of Fame**: Recognition for exceptional donors
- **Contact**: Contact form and information

### User Features
- **Authentication**: Register, login, forgot password
- **Donation System**: 
  - General, Zakat, Sadaqa, Sadaqa Jaria donations
  - Project-specific and faculty-specific donations
  - Razorpay payment integration (secure, PCI-DSS compliant)
  - Guest donations (no account required)
  - Auto-generated PDF receipts
  - Email notifications
- **Dashboard**: 
  - Donation history
  - Download receipts
  - Total contribution stats
  - Profession-based categorization

### Admin Features
- **Separate Admin Login**: Dedicated admin portal at `/admin/login`
- **Dashboard**: Comprehensive analytics, charts, and statistics
- **Project Management**: Create, edit, delete projects (visible to all users)
- **Donation Management**: View all donations, filter, export CSV
- **Donor Management**: View donors, mark Hall of Fame
- **Media Management**: Upload, approve, delete media (Cloudinary)
- **Content Management**: Post and manage content visible to users

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** authentication (access + refresh tokens)
- **Razorpay** payment integration (secure payment gateway)
- **Cloudinary** for media storage
- **PDFKit** for receipt generation
- **Nodemailer** for emails

### Frontend
- **React.js** + **Vite**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Recharts** for analytics
- **React Hot Toast** for notifications
- **Axios** for API calls

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Razorpay account (for secure payments)
- Cloudinary account (for media storage)
- Email service (Gmail or SMTP)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dar-al-hikma
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

5. Seed the database (optional):
```bash
npm run seed
```

6. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your-razorpay-key-id
```

5. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🔐 Default Credentials (After Seeding)

**Admin:**
- Email: `admin@daralhikma.org`
- Password: `admin123`

**Users:**
- Email: `ahmed@example.com` / Password: `password123`
- Email: `fatima@example.com` / Password: `password123`
- Email: `omar@example.com` / Password: `password123`

## 📁 Project Structure

```
dar-al-hikma/
├── backend/
│   ├── controllers/      # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middlewares/      # Auth & error middlewares
│   ├── utils/            # Utilities (email, PDF, etc.)
│   ├── server.js         # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/     # API services
│   │   ├── hooks/        # Custom hooks
│   │   └── App.jsx       # Main app component
│   └── package.json
│
└── README.md
```

## 🚢 Deployment

### Backend (Render/Railway)
1. Set environment variables in your hosting platform
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel/Netlify)
1. Set environment variables
2. Build command: `npm run build`
3. Output directory: `dist`

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Donations
- `POST /api/donations/razorpay/order` - Create Razorpay order (guest or authenticated)
- `POST /api/donations/razorpay/verify` - Verify Razorpay payment (guest or authenticated)
- `GET /api/donations/my-donations` - Get user donations (authenticated)
- `GET /api/donations/:id` - Get donation by ID (authenticated)
- `GET /api/donations/:id/receipt` - Download receipt (public)

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project (admin)
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/donations` - All donations with filters
- `GET /api/admin/donations/export` - Export donations CSV

## 🎨 UI/UX Features

- **Premium Design**: Clean, modern interface with Islamic heritage inspiration
- **Color Palette**: Gold (#d4af37), Deep Green (#1a472a), White
- **Responsive**: Mobile-first design
- **Accessible**: WCAG compliant
- **SEO-Friendly**: Meta tags and semantic HTML

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS configuration
- Secure payment processing

## 📄 License

This project is proprietary software for Dar Al Hikma Trust.

## 🤝 Contributing

This is a private project. For contributions, please contact the project maintainers.

## 📞 Support

For support, email info@daralhikma.org or open an issue in the repository.

---

Built with ❤️ for Dar Al Hikma Trust

