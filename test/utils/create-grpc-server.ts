import * as grpc from '@grpc/grpc-js';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { dirname, join } from 'path';

import { ProtoGrpcType } from '../typings/hello';
import { GetInfoRequest } from '../typings/sample/v1/GetInfoRequest';
import { GetInfoResponse } from '../typings/sample/v1/GetInfoResponse';
import { PatchRequest } from '../typings/sample/v1/PatchRequest';
import { PatchResponse } from '../typings/sample/v1/PatchResponse';
import { PutRequest } from '../typings/sample/v1/PutRequest';
import { PutResponse } from '../typings/sample/v1/PutResponse';
import { RemoveUserRequest } from '../typings/sample/v1/RemoveUserRequest';
import { RemoveUserResponse } from '../typings/sample/v1/RemoveUserResponse';
import { SayHelloRequest } from '../typings/sample/v1/SayHelloRequest';
import { SayHelloResponse } from '../typings/sample/v1/SayHelloResponse';

function HelloImp(
  call: ServerUnaryCall<SayHelloRequest, SayHelloResponse>,
  callback: sendUnaryData<SayHelloResponse>,
) {
  callback(null, {
    requestId: call.request.requestId,
    message: `hello ${call.request.name}`,
  });
}

function GetInfoImp(
  call: ServerUnaryCall<GetInfoRequest, GetInfoResponse>,
  callback: sendUnaryData<GetInfoResponse>,
) {
  callback(null, { requestId: call.request.requestId, serverName: 'foo' });
}

function RemoveUserImp(
  call: ServerUnaryCall<RemoveUserRequest, RemoveUserResponse>,
  callback: sendUnaryData<RemoveUserResponse>,
) {
  callback(null, { requestId: call.request.requestId, success: true });
}

function PutImp(
  call: ServerUnaryCall<PutRequest, PutResponse>,
  callback: sendUnaryData<PutResponse>,
) {
  callback(null, { requestId: call.request.requestId, status: 'updated' });
}

function PatchImp(
  call: ServerUnaryCall<PatchRequest, PatchResponse>,
  callback: sendUnaryData<PatchResponse>,
) {
  callback(null, { requestId: call.request.requestId, status: 'patched' });
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
    GetInfo: GetInfoImp,
    RemoveUser: RemoveUserImp,
    Put: PutImp,
    Patch: PatchImp,
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
