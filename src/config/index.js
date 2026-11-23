import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import staging from './environments/staging.js';
import preprod from './environments/preprod.js';
import prod from './environments/prod.js';

const environments = { staging, preprod, prod };
const env = process.env.APP_ENV ?? process.argv[2] ?? 'staging';

if (!Object.hasOwn(environments, env)) {
  throw new Error('APP_ENV must be staging, preprod, or prod.');
}

// Resolve from this module so starting the app from another folder still works.
const envFile = fileURLToPath(new URL(`../../.env.${env}`, import.meta.url));
if (existsSync(envFile)) {
  // Existing process variables take precedence over values in the file.
  process.loadEnvFile(envFile);
}

const defaults = environments[env];
const portValue = String(process.env.PORT ?? defaults.port);
const port = Number(portValue);

if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const mongodbUri = process.env.MONGODB_URI ?? defaults.mongodbUri;
if (!mongodbUri.trim()) {
  throw new Error('MONGODB_URI must not be empty.');
}

export default Object.freeze({ env, port, mongodbUri });
