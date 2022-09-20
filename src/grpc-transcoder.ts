import { NextFunction, Request, Response } from 'express';

import { loadServices } from './utils/load-services';

export function grpcTranscoder(
  filepath: string,
  options: { includeDirs: string[] },
) {
  return function (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const services = loadServices(filepath, options);

    console.log(services);

    next();
  };
}
