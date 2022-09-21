import * as grpc from '@grpc/grpc-js';
import * as bodyParser from 'body-parser';
import { randomUUID as uuid } from 'crypto';
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

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(grpcTranscoder(filePaths, 'localhost:5000', { includeDirs }));
  });

  it('GET request should return expected result', async () => {
    const requestId = uuid();

    return request(http)
      .get(`/v1/get/${requestId}`)
      .then(({ statusCode, body }) => {
        expect(statusCode).toEqual(200);
        expect(body).toEqual({ requestId, serverName: 'foo' });
      });
  });

  it('POST request should return expected result', async () => {
    const requestId = uuid();

    return request(http)
      .post(`/v1/post/${requestId}`)
      .send({ name: 'world' })
      .then(({ statusCode, body }) => {
        expect(statusCode).toEqual(200);
        expect(body).toEqual({ requestId, message: 'hello world' });
      });
  });

  it('DELETE request should return expected result', async () => {
    const requestId = uuid();

    return request(http)
      .del(`/v1/delete/${requestId}`)
      .then(({ statusCode, body }) => {
        expect(statusCode).toEqual(200);
        expect(body).toEqual({ requestId, success: true });
      });
  });

  it('PUT request should return expected result', async () => {
    const requestId = uuid();

    return request(http)
      .put(`/v1/put/${requestId}`)
      .then(({ statusCode, body }) => {
        expect(statusCode).toEqual(200);
        expect(body).toEqual({ requestId, status: 'updated' });
      });
  });

  it('PATCH request should return expected result', async () => {
    const requestId = uuid();

    return request(http)
      .patch(`/v1/patch/${requestId}`)
      .then(({ statusCode, body }) => {
        expect(statusCode).toEqual(200);
        expect(body).toEqual({ requestId, status: 'patched' });
      });
  });

  afterAll(async () => {
    http.close();
    grpc.forceShutdown();
  });
});
