import Task from '../models/Task.js';

export const listTasks = () => Task.find().sort({ createdAt: -1 });
export const getTask = (id) => Task.findById(id);
export const createTask = (data) => Task.create(data);
export const updateTask = (id, data) => Task.findByIdAndUpdate(id, { $set: data }, {
  runValidators: true,
  returnDocument: 'after',
});
export const deleteTask = (id) => Task.findByIdAndDelete(id);
