import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import healthRoutes from './routes/health.routes';
import itemsRoutes from './routes/items.routes';
import rentalsRoutes from './routes/rentals.routes';
import usersRoutes from './routes/users.routes';
import aiRoutes from './routes/ai.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);
      if (
        requestOrigin === env.FRONTEND_URL ||
        requestOrigin.endsWith('.vercel.app') ||
        requestOrigin.startsWith('http://localhost:') ||
        requestOrigin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes); // Fallback alias
app.use('/api/items', itemsRoutes);
app.use('/api/rentals', rentalsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);

// 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
