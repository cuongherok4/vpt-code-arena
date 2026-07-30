import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const envFiles = ['.env', 'websocket-service/.env', 'backend/.env', '../backend/.env'];

export function loadLocalEnv(): void {
  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    loadEnvFile(path);
  }
}

export function redisUrlFromEnv(): string {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || '6379';
  return `redis://${host}:${port}`;
}

function loadEnvFile(path: string): void {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = unquote(trimmed.slice(separatorIndex + 1).trim());
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function unquote(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}
