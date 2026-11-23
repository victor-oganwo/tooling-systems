import express from 'express';
import mongoose from 'mongoose';
import config from './config/index.js';
import taskRoutes from './routes/tasks.js';

const app = express();
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    environment: config.env,
    database: connected ? 'connected' : 'disconnected',
  });
});

app.use('/tasks', taskRoutes);
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'JSON body exceeds the 10kb limit.' });
  }
  if (error instanceof mongoose.Error.ValidationError
      || error instanceof mongoose.Error.CastError
      || error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid request data.' });
  }
  res.status(500).json({ error: 'An internal error occurred.' });
});

export default app;
