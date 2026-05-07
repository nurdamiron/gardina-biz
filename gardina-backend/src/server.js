import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './infrastructure/database/config.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Proxy (Required for Render/Heroku to get correct client IP)
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());

// CORS - Allow multiple origins for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://gardina-web.vercel.app',
  'https://app.gardina.kz',
  'https://gardina.kz',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Requests without an Origin header (curl, Postman, server-to-server)
    // are allowed only in non-production environments. In production we
    // require browsers to send Origin so we can verify it.
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(null, false);
      }
      return callback(null, true);
    }

    // Remove trailing slash from origin for comparison
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    // В development разрешаем любой порт localhost (Vite и т.п.)
    if (
      process.env.NODE_ENV === 'development' &&
      /^http:\/\/localhost:\d+$/.test(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed?.endsWith('/') ? allowed.slice(0, -1) : allowed;
      return normalizedOrigin === normalizedAllowed;
    });

    if (isAllowed) {
      return callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      // Return null (no error) with false — express-cors will send 403, not 500
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Body parsing — 1 MB is enough for any realistic JSON request. File uploads
// go through multer with their own 10 MB limit.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api', limiter);

// Request logging (simple version)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  }
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// API ROUTES
// ============================================

app.get('/api', (req, res) => {
  res.json({
    name: 'Gardina API',
    version: '1.0.0',
    description: 'Backend API for Curtain Designer Management System',
    architecture: 'Domain-Driven Design (DDD)',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs',
    }
  });
});

// Import route modules
import authRoutes from './presentation/http/routes/auth.routes.js';
import orderRoutes from './presentation/http/routes/order.routes.js';
import clientRoutes from './presentation/http/routes/client.routes.js';
import measurementRoutes from './presentation/http/routes/measurement.routes.js';
import proposalRoutes from './presentation/http/routes/proposal.routes.js';
import uploadRoutes from './presentation/http/routes/upload.routes.js';
import userRoutes from './presentation/http/routes/user.routes.js';
import catalogRoutes from './presentation/http/routes/catalog.routes.js';
import analyticsRoutes from './presentation/http/routes/analytics.routes.js';
import paymentRoutes from './presentation/http/routes/payment.routes.js';
import notificationRoutes from './presentation/http/routes/notification.routes.js';
import installationRoutes from './presentation/http/routes/installation.routes.js';
import auditRoutes from './presentation/http/routes/audit.routes.js';
import billingRoutes from './presentation/http/routes/billing.routes.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/installations', installationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/billing', billingRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.url}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('');
    console.log('🎉 ================================================');
    console.log(`🚀  Gardina API`);
    console.log('🎉 ================================================');
    console.log('');
    console.log(`📍  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐  Server running on: http://localhost:${PORT}`);
    console.log(`🗄️   Database: ${process.env.DATABASE_NAME}`);
    console.log(`🏗️   Architecture: Domain-Driven Design (DDD)`);
    console.log('');
    console.log(`📚  API Endpoints:`);
    console.log(`    - Health Check: http://localhost:${PORT}/health`);
    console.log(`    - API Info: http://localhost:${PORT}/api`);
    console.log('');
    console.log('✅  Server is ready to accept connections!');
    console.log('');
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  pool.end(() => {
    console.log('Database pool closed.');
    process.exit(0);
  });
});

export default app;
