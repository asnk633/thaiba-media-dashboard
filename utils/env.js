// utils/env.js
export function getEnv(name, fallback) {
  const val = process.env[name];
  if (val === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env var: ${name}`);
  }
  return val;
}
