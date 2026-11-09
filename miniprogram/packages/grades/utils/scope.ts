const runtime = require('../../../utils/grades');
export const scopeKey: () => string = runtime.scopeKey;
export function guardAwait<T>(value: T | PromiseLike<T>, key: string): Promise<T> { return runtime.guardAwait(value, key); }

export const scopeTimeout: (fn: () => void, delay: number) => number = runtime.scopedTimeout;
