import * as grpc from '@grpc/grpc-js';
import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { dirname, join } from 'path';

import { ProtoGrpcType } from '../typings/hello';
import { DeleteRequest } from '../typings/sample/v1/DeleteRequest';
import { DeleteResponse } from '../typings/sample/v1/DeleteResponse';
import { GetRequest } from '../typings/sample/v1/GetRequest';
import { GetResponse } from '../typings/sample/v1/GetResponse';
import { PatchRequest } from '../typings/sample/v1/PatchRequest';
import { PatchResponse } from '../typings/sample/v1/PatchResponse';
import { PostRequest } from '../typings/sample/v1/PostRequest';
import { PostResponse } from '../typings/sample/v1/PostResponse';
import { PutRequest } from '../typings/sample/v1/PutRequest';
import { PutResponse } from '../typings/sample/v1/PutResponse';

function PostImp(
  call: ServerUnaryCall<PostRequest, PostResponse>,
  callback: sendUnaryData<PostResponse>,
) {
  callback(null, {
    requestId: call.request.requestId,
    message: `hello ${call.request.name}`,
  });
}

function GetImp(
  call: ServerUnaryCall<GetRequest, GetResponse>,
  callback: sendUnaryData<GetResponse>,
) {
  callback(null, { requestId: call.request.requestId, serverName: 'foo' });
}

function DeleteImp(
  call: ServerUnaryCall<DeleteRequest, DeleteResponse>,
  callback: sendUnaryData<DeleteResponse>,
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
    Post: PostImp,
    Get: GetImp,
    Delete: DeleteImp,
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
