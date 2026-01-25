// src/infrastructure/web/server.ts

import cors from 'cors';
import express, { Application, Request, Response, NextFunction } from 'express';
import { corsOptions } from '../config/cors.config';
import swaggerSpec from '../config/swagger.config';
import swaggerUi from 'swagger-ui-express';

// routes
import taskRoutes from './routes/task.routes';
import trelloRoutes from './routes/trello.routes';
import designRoutes from './routes/design.routes';
import designVersionRoutes from './routes/design-version.routes';
import aiModelsRoutes from './routes/ai-models.routes';
import designSystemsRoutes from './routes/design-systems.routes';

import { setupDependencies } from './dependencies';
import { logger } from './middleware/logger.middleware';
import compression from 'compression';


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
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Apply User Middleware globally
    // It will handle skipping for public paths internally
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.container.userMiddleware.handle(req, res, next);
    });
  }

  private configureRoutes(): void {
    // Health check
    this.app.get('/', (_, res) => {
      res.send('Task Creator API is running');
    });

    // Routes
    this.app.use('/api/tasks', taskRoutes(this.container.taskController));
    this.app.use('/api/trello', trelloRoutes(this.container.trelloController));
    this.app.use('/api/designs', designRoutes(this.container.designController));
    this.app.use('/api/design-versions', designVersionRoutes(this.container.designVersionController));
    this.app.use('/api/ai-models', aiModelsRoutes(this.container.aiModelsController)); // ← NEW
    this.app.use('/api/design-systems', designSystemsRoutes(this.container.designSystemsController));
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // API documentation redirect
    this.app.get('/api', (_, res) => {
      res.redirect('/api/docs');
    });
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
      console.log(`⚕️  Health Check: http://localhost:${this.port}/health`);
      console.log(`🤖 AI Models API: http://localhost:${this.port}/api/ai-models`);
      console.log(`🎨 Design Systems API: http://localhost:${this.port}/api/design-systems`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}