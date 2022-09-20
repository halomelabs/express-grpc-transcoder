import * as grpc from '@grpc/grpc-js';
import * as express from 'express';
import * as http from 'http';
import { dirname, join } from 'path';
import * as request from 'supertest';

import { grpcTranscoder } from '../src/grpc-transcoder';
import { createGrpcServer } from './utils/create-grpc-server';
import { createHttpServer } from './utils/create-http-server';

describe('HelloService (e2e)', () => {
  let http: http.Server;
  let app: express.Express;
  let grpc: grpc.Server;

  beforeAll(async () => {
    [http, app] = await createHttpServer(3000);
    grpc = await createGrpcServer('localhost:5000');

    const filePaths = [
      join(process.cwd(), 'proto/sample/v1/services/hello.proto'),
    ];
    const includeDirs = [
      dirname(require.resolve('google-proto-files/package.json')),
      join(process.cwd(), './proto'),
    ];

    app.use(grpcTranscoder(filePaths, { includeDirs }));
  });

  it('.Hello() should return expected result', async () => {
    return request(http)
      .post('/hello')
      .send({ name: 'world' })
      .then(({ body }) => {
        expect(body.message).toEqual('hello world');
      });
  });

  afterAll(async () => {
    http.close();
    grpc.forceShutdown();
  });
});
