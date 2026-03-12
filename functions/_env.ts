type RuntimeEnv = Record<string, string | undefined>;
type DenoLike = {
  env?: {
    toObject?: () => Record<string, string>;
  };
};
type ProcessLike = {
  env?: RuntimeEnv;
};

const runtimeGlobal = globalThis as typeof globalThis & {
  Deno?: DenoLike;
  process?: ProcessLike;
};

let cachedRuntimeEnv: RuntimeEnv | null = null;

const readProcessEnv = (): RuntimeEnv | null => {
  const env = runtimeGlobal.process?.env;
  return env && typeof env === 'object' ? env : null;
};

const readDenoEnv = (): RuntimeEnv | null => {
  const toObject = runtimeGlobal.Deno?.env?.toObject;
  if (typeof toObject !== 'function') {
    return null;
  }

  return toObject();
};

const getRuntimeEnv = (): RuntimeEnv => {
  if (cachedRuntimeEnv) {
    return cachedRuntimeEnv;
  }

  cachedRuntimeEnv = readProcessEnv() || readDenoEnv() || {};
  return cachedRuntimeEnv;
};

export const getEnv = (name: string) => {
  const value = getRuntimeEnv()[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

export const getFirstEnv = (...names: string[]) => {
  for (const name of names) {
    const value = getEnv(name);
    if (value) {
      return value;
    }
  }

  return undefined;
};

export const requireEnv = (name: string) => {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
};