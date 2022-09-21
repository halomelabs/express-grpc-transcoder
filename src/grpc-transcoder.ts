import type { ServiceClientConstructor, ServiceError } from '@grpc/grpc-js';
import * as grpc from '@grpc/grpc-js';
import type { ServiceClient } from '@grpc/grpc-js/build/src/make-client';
import * as ProtoLoader from '@grpc/proto-loader';
import { Request, Response, Router } from 'express';
import type { IncomingHttpHeaders } from 'http';

import camelCase = require('lodash.camelcase');
import get = require('lodash.get');

import { loadServices } from './utils/load-services';
import { HttpRule, mapMethodOptions } from './utils/map-options';

function hasValidHttpVerb(rule: HttpRule): boolean {
  return (
    'get' in rule ||
    'put' in rule ||
    'post' in rule ||
    'delete' in rule ||
    'patch' in rule
  );
}

const FORBIDDEN_HTTP1_HEADERS = ['connection', 'content-length'];

function convertUrl(url: string) {
  return url.replace(/{(\w+)}/g, ':$1');
}

function convertHeaders(headers: IncomingHttpHeaders) {
  const metadata = new grpc.Metadata();

  for (const [key, raw] of Object.entries(headers)) {
    if (FORBIDDEN_HTTP1_HEADERS.includes(key)) {
      continue;
    }

    const val = Array.isArray(raw) ? raw.pop() : raw;
    if (val) {
      metadata.set(key, val);
    }
  }

  return metadata;
}

function convertRequestPayload(req: Request) {
  let payload = {};

  switch (req.method) {
    case 'GET':
      payload = req.params;
      break;
    case 'POST':
    case 'PUT':
      payload = { ...req.params, ...req.body };
      break;
    case 'DELETE':
      payload = req.params;
      break;
    default:
      console.warn('invalid method');
      return {};
  }

  return Object.entries(payload).reduce(
    (payload, [k, v]) => Object.assign(payload, { [camelCase(k)]: v }),
    {},
  );
}

export function grpcTranscoder(
  filePaths: string[],
  target: string,
  options: { includeDirs: string[] },
): Router {
  const router = Router();
  const clients: Record<string, ServiceClient> = {};

  const protos = filePaths.map((p) => {
    const packageDefinition = ProtoLoader.loadSync(p, {
      includeDirs: options.includeDirs,
    });
    return grpc.loadPackageDefinition(packageDefinition);
  });

  for (const filePath of filePaths) {
    const services = loadServices(filePath, options);
    for (const service of services) {
      const constructor = get(
        protos[0],
        service.key,
      ) as ServiceClientConstructor;

      try {
        clients[service.key] = new constructor(
          target,
          grpc.credentials.createInsecure(),
        );
      } catch (e) {
        continue;
      }

      for (const [methodName, methodDef] of Object.entries(
        service.definition.methods,
      )) {
        const options = mapMethodOptions(methodDef.parsedOptions);
        const httpRule = options?.['(google.api.http)'];
        if (!httpRule || !hasValidHttpVerb(httpRule)) {
          continue;
        }

        const genericHandler = (req: Request, res: Response) => {
          const payload = convertRequestPayload(req);
          const meta = convertHeaders(req.headers);

          clients[service.key][methodName](
            payload,
            meta,
            (err: ServiceError, result: unknown) => {
              if (err) {
                console.error(err.message);
                return res
                  .status(500)
                  .json({ code: err.code, message: err.message });
              }

              res.json(result);
            },
          );
        };

        if ('get' in httpRule && typeof httpRule.get === 'string') {
          router.get(convertUrl(httpRule.get), genericHandler);
        } else if ('post' in httpRule && typeof httpRule.post === 'string') {
          router.post(convertUrl(httpRule.post), genericHandler);
        } else if (
          'delete' in httpRule &&
          typeof httpRule.delete === 'string'
        ) {
          router.delete(convertUrl(httpRule.delete), genericHandler);
        }
      }
    }
  }

  router.all('*', (req, res) => {
    res.status(404).json({ code: grpc.status.NOT_FOUND, message: 'Not found' });
  });

  return router;
}
