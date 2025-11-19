import cors from 'cors';

import express, { Application, Request, Response, NextFunction } from 'express';

import { corsOptions } from '../config/cors.config';

// routes
import taskRoutes from './routes/task.routes';
import trelloRoutes from './routes/trello.routes';
import { setupDependencies } from './dependencies';


export class Server {
  private app: Application;
  private port: number;
  private container: any;


  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.container = setupDependencies()
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private configureRoutes(): void {

    // Health check
    this.app.get('/', (_, res) => {
      res.send('Task Creator API is running');
    });

    this.app.use('/api/tasks', taskRoutes(this.container.taskController));
    this.app.use('/api/trello', trelloRoutes(this.container.trelloController));
  }

  private configureErrorHandling(): void {

    // 500 handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
      });
    });

    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });

  }

  public async start(): Promise<void> {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}