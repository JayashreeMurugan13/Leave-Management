# Backend Setup

This backend uses a local MySQL database.

## Environment

Use the values in `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/leave_system"
JWT_SECRET="your_secret"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
```

## Quick MySQL Option

If MySQL is not installed locally, start one with Docker:

```bash
docker run --name mysql-db -e MYSQL_ROOT_PASSWORD=1234 -e MYSQL_DATABASE=leave_system -p 3306:3306 -d mysql:8
```

If you use that container command, update `DATABASE_URL` to match the password:

```env
DATABASE_URL="mysql://root:1234@localhost:3306/leave_system"
```

## Database Initialization

Run:

```bash
npm run db:generate
npm run db:migrate
npm run db:test-data
```

`prisma/test_data.sql` inserts sample users for Student, Professor, HOD, and Principal logins.
