// src/infrastructure/web/server.ts

import cors from 'cors';
import express, { Application, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';

// config
import { corsOptions } from '../config/cors.config';
import swaggerSpec from '../config/swagger.config';

// routes
import designRoutes from './routes/design.routes';
import aiModelsRoutes from './routes/ai-models.routes';
import designSystemsRoutes from './routes/design-systems.routes';
import clientErrorRoutes from './routes/client-error.routes';
import uiLibraryRoutes from './routes/ui-library.routes';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';

import { setupDependencies } from './dependencies';

import { logger } from './middleware/logger.middleware';

export class Server {
  private app: Application;
  private port: number;
  private container: any;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.container = setupDependencies();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(compression({
      level: 6, // Balance between speed and compression
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      }
    }));
    this.app.use(logger);
    this.app.use(cors(corsOptions));
    this.app.use(cookieParser());
    this.app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Auth Middleware - extracts JWT from cookie/header and attaches user
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.container.authMiddleware.handle(req, res, next);
    });
  }

  private configureRoutes(): void {
    const pagesDir = join(__dirname, '../../../public/pages');

    // Health check
    this.app.get('/', (_, res) => {
      res.sendFile(join(pagesDir, 'home.html'));
    });

    // Payment redirect pages
    this.app.get('/payments/success', (_req, res) => {
      res.sendFile(join(pagesDir, 'payment-successful.html'));
    });

    this.app.get('/payments/cancel', (_req, res) => {
      res.sendFile(join(pagesDir, 'payment-cancelled.html'));
    });

    // Routes
    this.app.use('/api', (req, res, next) => {
      this.container.authMiddleware.requireAuthForApi(req, res, next);
    });

    this.app.use('/auth', authRoutes(this.container.authController));
    this.app.use('/api/designs', designRoutes(this.container.designController));
    this.app.use('/api/ai-models', aiModelsRoutes(this.container.aiModelsController));
    this.app.use('/api/design-systems', designSystemsRoutes(this.container.designSystemsController));
    this.app.use('/api/errors', clientErrorRoutes(this.container.clientErrorController));
    this.app.use('/api/ui-library', uiLibraryRoutes(this.container.uiLibraryController));
    this.app.use('/api/payments', paymentRoutes(this.container.paymentController));
    this.app.use('/api/subscriptions', subscriptionRoutes(this.container.subscriptionController));
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  private configureErrorHandling(): void {
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    });

    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });
  }

  public async start(): Promise<void> {
    this.app.listen(this.port, () => {
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`📚 API Documentation: http://localhost:${this.port}/docs`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}
