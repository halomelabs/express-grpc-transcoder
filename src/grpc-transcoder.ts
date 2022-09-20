import * as grpc from '@grpc/grpc-js';
import * as ProtoLoader from '@grpc/proto-loader';
import { Router } from 'express';
import { get } from 'lodash';

import { loadServices } from './utils/load-services';

export function grpcTranscoder(
  filePaths: string[],
  options: { includeDirs: string[] },
): Router {
  const router = Router();

  const protos = filePaths.map((p) => {
    const packageDefinition = ProtoLoader.loadSync(p, {
      includeDirs: options.includeDirs,
    });
    return grpc.loadPackageDefinition(packageDefinition);
  });

  for (const filePath of filePaths) {
    const services = loadServices(filePath, options);
    for (const service of services) {
      const constructor = get(protos[0], service.key);
      console.log(constructor);
    }
  }

  return router;
}
