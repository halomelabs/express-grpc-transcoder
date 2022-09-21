import { accessSync, constants } from 'fs';
import { isAbsolute, join } from 'path';
import * as Protobuf from 'protobufjs';

function joinName(baseName: string, name: string): string {
  return baseName === '' ? name : baseName + '.' + name;
}

interface ServiceDefinition {
  key: string;
  definition: Protobuf.Service;
}

function getAllServices(
  obj: Protobuf.ReflectionObject,
  parentName: string,
): ServiceDefinition[] {
  const objName = joinName(parentName, obj.name);
  if (obj instanceof Protobuf.Service) {
    return [{ key: objName, definition: obj }];
  } else if (
    (obj instanceof Protobuf.Namespace || obj instanceof Protobuf.Root) &&
    typeof obj.nested !== 'undefined'
  ) {
    return Object.keys(obj.nested)
      .map((name) => {
        return getAllServices(obj.nested![name], objName);
      })
      .reduce(
        (accumulator, currentValue) => accumulator.concat(currentValue),
        [],
      );
  }
  return [];
}

function addIncludePathResolver(root: Protobuf.Root, includePaths: string[]) {
  const originalResolvePath = root.resolvePath;
  root.resolvePath = (origin: string, target: string) => {
    if (isAbsolute(target)) {
      return target;
    }
    for (const directory of includePaths) {
      const fullPath: string = join(directory, target);
      try {
        accessSync(fullPath, constants.R_OK);
        return fullPath;
      } catch (err) {
        continue;
      }
    }
    console.warn(
      `${target} not found in any of the include paths ${includePaths}`,
    );
    return originalResolvePath(origin, target);
  };
}

function loadSync(
  filename: string,
  options: Protobuf.IParseOptions & { includeDirs?: string[] } = {},
) {
  const root = new Protobuf.Root();
  if (options.includeDirs) {
    if (!Array.isArray(options.includeDirs)) {
      throw new Error('The includeDirs option must be an array');
    }
    addIncludePathResolver(root, options.includeDirs as string[]);
  }
  const loadedRoot = root.loadSync(filename, options);
  loadedRoot.resolveAll();
  return loadedRoot;
}

export function loadServices(
  filename: string,
  options: Protobuf.IParseOptions & { includeDirs?: string[] } = {},
): ServiceDefinition[] {
  // TODO: use @grpc/proto-loader after this https://github.com/grpc/grpc-node/pull/2230
  const obj = loadSync(filename, options);
  return getAllServices(obj, '');
}
