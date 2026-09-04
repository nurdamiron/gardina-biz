import * as Sentry from '@sentry/node';
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

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

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
import onboardingRoutes from './presentation/http/routes/onboarding.routes.js';
import dealRoutes from './presentation/http/routes/deal.routes.js';
import leadRoutes from './presentation/http/routes/lead.routes.js';

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
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/leads', leadRoutes);

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
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.url}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Never leak internal error details (DB messages, schema, library internals)
  // to clients in production. Client errors (4xx) carry intentional messages;
  // 5xx get a generic message and the real cause stays in the logs / Sentry.
  const safeMessage = status < 500
    ? (err.message || 'Request error')
    : (isProd ? 'Внутренняя ошибка сервера. Попробуйте позже.' : (err.message || 'Internal Server Error'));

  res.status(status).json({
    success: false,
    error: err.name || 'Error',
    message: safeMessage,
    ...(!isProd && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// ============================================
// AUTO MIGRATIONS
// ============================================

async function runAutoMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // measurement_windows columns (add_price_cols)
    await client.query(`
      ALTER TABLE measurement_windows
        ADD COLUMN IF NOT EXISTS fabric_code TEXT,
        ADD COLUMN IF NOT EXISTS fabric_brand TEXT,
        ADD COLUMN IF NOT EXISTS design_photos JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS price_breakdown JSONB DEFAULT '{}';
    `);

    await client.query(`
      ALTER TABLE measurements
        ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS map_link TEXT,
        ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'standard',
        ADD COLUMN IF NOT EXISTS styles TEXT,
        ADD COLUMN IF NOT EXISTS curtain_types TEXT,
        ADD COLUMN IF NOT EXISTS technical_features JSONB DEFAULT '[]';
    `);

    // fabrics extra columns (001-catalog-system)
    await client.query(`
      ALTER TABLE fabrics
        ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
        ADD COLUMN IF NOT EXISTS width_cm INTEGER DEFAULT 280,
        ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
    `);

    // rooms table (001-catalog-system) — required by the measurement save() sync.
    // On a fully-migrated DB this is a no-op; it backfills DBs provisioned without 001.
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        order_number INTEGER NOT NULL DEFAULT 1,
        window_count INTEGER DEFAULT 1,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_rooms_measurement ON rooms(measurement_id);`);

    // service_rates table (001-catalog-system)
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        service_type VARCHAR(50) NOT NULL DEFAULT 'installation',
        calc_method VARCHAR(50) NOT NULL DEFAULT 'per_meter',
        base_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // service_rates complexity multipliers (full schema from 001-catalog-system).
    // The simplified CREATE TABLE above omits them, so DBs provisioned via
    // auto-migrate lacked these columns and /catalog/services 500'd
    // ("column complexity_simple does not exist").
    await client.query(`
      ALTER TABLE service_rates
        ADD COLUMN IF NOT EXISTS complexity_simple DECIMAL(3,2) DEFAULT 1.0,
        ADD COLUMN IF NOT EXISTS complexity_medium DECIMAL(3,2) DEFAULT 1.3,
        ADD COLUMN IF NOT EXISTS complexity_complex DECIMAL(3,2) DEFAULT 2.0;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        salon VARCHAR(255),
        comment TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        source VARCHAR(50) NOT NULL DEFAULT 'landing',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // APNs (iOS push) — extend push_subscriptions with platform + device_token.
    // Guarded so it is a no-op if the notification system (015) hasn't run yet.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions'
        ) THEN
          ALTER TABLE push_subscriptions
            ADD COLUMN IF NOT EXISTS platform VARCHAR(10) NOT NULL DEFAULT 'web',
            ADD COLUMN IF NOT EXISTS device_token TEXT;
        END IF;
      END $$;
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device_token
         ON push_subscriptions(device_token) WHERE device_token IS NOT NULL;`
    );

    // products CHECK constraints were stale and rejected the unit/type values
    // the product form actually sends (unit m/pcs/roll/pack/box/pair; type
    // ready_made) -> every such create/edit 500'd. Widen them to a superset of
    // legacy + app values so existing rows stay valid and new ones are accepted.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
          ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_check;
          ALTER TABLE products ADD CONSTRAINT products_unit_check
            CHECK (unit IN ('meter','piece','set','item','m','pcs','roll','pack','box','pair'));

          ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
          ALTER TABLE products ADD CONSTRAINT products_type_check
            CHECK (type IN ('fabric','curtain','accessory','service','blackout','tulle','cornice','jalousie','ready_made'));
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('✅  Auto-migrations completed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('⚠️  Auto-migration error (non-fatal):', err.message);
  } finally {
    client.release();
  }
}

// ============================================
// START SERVER
// ============================================

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  runAutoMigrations().catch(e => console.error('Migration error:', e.message));
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

  // Background cron — trial-warning, expiry, cleanup. In multi-instance
  // setups only one instance should run this; gate via CRON_LEADER=1 env
  // var on the chosen instance, default ON for single-instance deploys.
  if (process.env.CRON_LEADER !== '0') {
    import('./application/services/BillingCron.js')
      .then(({ startBillingCron }) => startBillingCron())
      .catch((e) => console.error('[BillingCron] failed to start:', e.message));
  }
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
