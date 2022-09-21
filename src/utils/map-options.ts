export enum IdempotencyLevel {
  IDEMPOTENCY_UNKNOWN = 0,
  NO_SIDE_EFFECTS = 1,
  IDEMPOTENT = 2,
}

export interface NamePart {
  namePart: string;
  isExtension: boolean;
}

export interface UninterpretedOption {
  name?: NamePart[] | null;
  identifierValue?: string | null;
  positiveIntValue?: number | Long | string | null;
  negativeIntValue?: number | Long | string | null;
  doubleValue?: number | null;
  stringValue?: Uint8Array | string | null;
  aggregateValue?: string | null;
}

export interface CustomHttpPattern {
  kind?: string | null;
  path?: string | null;
}

export interface HttpRule {
  selector?: string | null;
  get?: string | null;
  put?: string | null;
  post?: string | null;
  delete?: string | null;
  patch?: string | null;
  custom?: CustomHttpPattern | null;
  body?: string | null;
  responseBody?: string | null;
  additionalBindings?: HttpRule[] | null;
}

export interface MethodOptions {
  deprecated?: boolean | null;
  idempotency_level?: IdempotencyLevel | keyof typeof IdempotencyLevel | null;
  uninterpreted_option?: UninterpretedOption[] | null;
  '(google.api.http)'?: HttpRule | null;
  '(google.api.method_signature)'?: string[] | null;
}

export function mapMethodOptions(
  options: Partial<MethodOptions>[] | undefined,
): MethodOptions | undefined {
  return Array.isArray(options)
    ? options.reduce(
        (obj: MethodOptions, item: Partial<MethodOptions>) => ({
          ...obj,
          ...item,
        }),
        {},
      )
    : undefined;
}
