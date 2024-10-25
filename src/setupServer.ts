import {
  CustomError,
  IErrorResponse,
} from './shared/global/helpers/error-handler';
import {
  Application,
  json,
  urlencoded,
  Response,
  Request,
  NextFunction,
} from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import 'express-async-errors';
import { config } from './config';
import { createAdapter } from '@socket.io/redis-adapter';
import Logger from 'bunyan';
import applicationRoutes from './routes';
import { ErrorRequestHandler } from 'express'; // Add this import

const SERVER_PORT = 5000;
const log: Logger = config.createLogger('server');

export class DevalokeServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routeMiddleware(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  public securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600000,
        secure: config.NODE_ENV !== 'development',
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      })
    );
  }

  public standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));
  }

  public routeMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  public globalErrorHandler(app: Application): void {
    // Handling routes that don't exist
    app.all('*', (req: Request, res: Response) => {
      res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ message: `${req.originalUrl} not found` });
    });

    // Error-handling middleware
    const errorHandler: ErrorRequestHandler = (
      error: IErrorResponse,
      _req: Request,
      res: Response,
      next: NextFunction
    ) => {
      log.error(error);

      // If error is an instance of CustomError, handle it
      if (error instanceof CustomError) {
        res.status(error.statusCode).json(error.serializeErrors());
      } else {
        // Handle unknown errors
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: 'An unexpected error occurred',
        });
      }

      // No need to call next() or return anything; we have handled the response
    };

    // Register the error-handling middleware
    app.use(errorHandler);
  }

  public async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const SocketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(SocketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    });

    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  public startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server running on ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {}
}
