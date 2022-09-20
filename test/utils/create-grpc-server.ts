import * as grpc from '@grpc/grpc-js';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { dirname, join } from 'path';

import { ProtoGrpcType } from '../typings/hello';
import { HelloRequest } from '../typings/sample/v1/HelloRequest';
import { HelloResponse } from '../typings/sample/v1/HelloResponse';

function HelloImp(
  call: ServerUnaryCall<HelloRequest, HelloResponse>,
  callback: sendUnaryData<HelloResponse>,
) {
  const name = call.request.name;
  callback(null, { message: `hello ${name}` });
}

export async function createGrpcServer(host: string): Promise<grpc.Server> {
  const server = new grpc.Server();
  const includeDirs = [
    dirname(require.resolve('google-proto-files/package.json')),
    join(process.cwd(), './proto'),
  ];

  const packageDefinition = ProtoLoader.loadSync(
    join(process.cwd(), 'proto/sample/v1/services/hello.proto'),
    { includeDirs },
  );
  const proto = grpc.loadPackageDefinition(
    packageDefinition,
  ) as unknown as ProtoGrpcType;

  server.addService(proto.sample.v1.services.Hello.service, {
    Hello: HelloImp,
  });

  return new Promise((resolve, reject) => {
    server.bindAsync(host, grpc.ServerCredentials.createInsecure(), (error) => {
      if (error !== null) {
        console.error(error);
        reject(error);
      }

      server.start();
      console.log(`.createGrpcServer() server started at ${host}`);
      resolve(server);
    });
  });
}
