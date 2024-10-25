import express, { Express } from 'express';
import { DevalokeServer } from './setupServer';
import databaseConnection from './setupDatabase';
import { config } from './config';

class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: DevalokeServer = new DevalokeServer(app);
    server.start();
  }

  private loadConfig() {
    config.validateConfig();
  }
}

const application: Application = new Application();
application.initialize();
