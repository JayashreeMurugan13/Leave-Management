import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { AppError } from './utils/AppError';

// Import Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import leaveRoutes from './routes/leaveRoutes';
import eventRoutes from './routes/eventRoutes';

const app = express();

// 1. Global Middleware
// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies to be sent
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Rate Limiter
app.use('/api', apiLimiter);

// 2. Routes (Mounting)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/events', eventRoutes);

// Test Route
app.get('/api/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'pong' });
});

// 3. Handle undefined routes
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. Global Error Handler
app.use(errorHandler);

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
});
