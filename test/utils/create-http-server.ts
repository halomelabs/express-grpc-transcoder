import * as express from 'express';
import { Server } from 'http';

export async function createHttpServer(
  port: number,
): Promise<[Server, express.Express]> {
  return new Promise((resolve) => {
    const app = express();

    const server = app.listen(port, () => {
      console.log(`.createHttpServer() server started at ${port}`);
      resolve([server, app]);
    });
  });
}
