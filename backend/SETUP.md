# Database Setup Guide

## PostgreSQL Setup

This project uses PostgreSQL as the database. Follow these steps to set it up:

### Option 1: Local PostgreSQL Installation

1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql`

2. **Start PostgreSQL Service**:
   - Windows: Open Services and start "PostgreSQL" service, or run:
     ```bash
     net start postgresql-x64-XX  # Replace XX with your version
     ```
   - Mac/Linux: 
     ```bash
     sudo service postgresql start
     # or
     brew services start postgresql
     ```

3. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE dar_al_hikma;
   
   # Exit
   \q
   ```

4. **Create `.env` file** in the `backend` directory:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/dar_al_hikma
   ```
   Replace `your_password` with your PostgreSQL password.

### Option 2: Cloud PostgreSQL (Recommended for Production)

You can use free PostgreSQL hosting services:

1. **Supabase** (Free tier available):
   - Sign up at https://supabase.com
   - Create a new project
   - Copy the connection string from Settings > Database
   - Use it as `DATABASE_URL` in `.env`

2. **Railway** (Free tier available):
   - Sign up at https://railway.app
   - Create a new PostgreSQL database
   - Copy the connection string
   - Use it as `DATABASE_URL` in `.env`

3. **Render** (Free tier available):
   - Sign up at https://render.com
   - Create a new PostgreSQL database
   - Copy the internal connection string
   - Use it as `DATABASE_URL` in `.env`

### Quick Setup Steps

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dar_al_hikma
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```

4. The database tables will be created automatically on first run.

### Troubleshooting

**Error: connect ECONNREFUSED**
- PostgreSQL is not running
- Check if PostgreSQL service is started
- Verify the port (default: 5432)
- Check your DATABASE_URL format

**Error: password authentication failed**
- Check your PostgreSQL password in DATABASE_URL
- Try resetting PostgreSQL password

**Error: database does not exist**
- Create the database first: `CREATE DATABASE dar_al_hikma;`

### Connection String Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://postgres:mypassword@localhost:5432/dar_al_hikma
```

