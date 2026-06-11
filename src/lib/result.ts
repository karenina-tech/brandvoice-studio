export type Ok<T> = readonly [null, T];
export type Err = readonly [Error, null];
export type Result<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return [null, data] as const;
}

export function err(error: Error | string): Err {
  const e = typeof error === 'string' ? new Error(error) : error;
  return [e, null] as const;
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
  return result[0] === null;
}

export function isErr<T>(result: Result<T>): result is Err {
  return result[0] !== null;
}
