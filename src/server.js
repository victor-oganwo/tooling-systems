import app from './app.js';
import config from './config/index.js';
import { connectDatabase } from './config/database.js';

try {
  await connectDatabase();
  const server = app.listen(config.port, () => {
    console.log(`Task API running in ${config.env} on port ${config.port}.`);
  });
  server.on('error', () => {
    console.error('Could not start the API. Check that the port is available.');
    process.exit(1);
  });
} catch {
  console.error('Could not connect to MongoDB. Check your database and environment configuration.');
  process.exit(1);
}
