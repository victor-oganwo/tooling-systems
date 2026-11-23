import { Router } from 'express';
import mongoose from 'mongoose';
import { listTasks, getTask, createTask, updateTask, deleteTask } from '../services/tasks.js';

const router = Router();

function validateBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).length === 0
      || Object.keys(body).some((key) => !['title', 'completed'].includes(key))
      || ('title' in body && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 200))
      || ('completed' in body && typeof body.completed !== 'boolean')) {
    return res.status(400).json({ error: 'Use a nonempty title (up to 200 characters) and/or a boolean completed value.' });
  }
  next();
}

router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }
  next();
});

router.get('/', async (req, res) => {
  res.json(await listTasks());
});

router.post('/', validateBody, async (req, res) => {
  res.status(201).json(await createTask(req.body));
});

router.get('/:id', async (req, res) => {
  const task = await getTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  res.json(task);
});

router.patch('/:id', validateBody, async (req, res) => {
  const task = await updateTask(req.params.id, req.body);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  res.json(task);
});

router.delete('/:id', async (req, res) => {
  const task = await deleteTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
});

export default router;
