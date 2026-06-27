import { api } from '../lib/api';
import { Task } from '../types';

export const taskService = {
  subscribeToTasks: (assignedTo: string | null, callback: (tasks: Task[]) => void) => {
    const fetch = () => {
      const path = assignedTo ? `/tasks?assignedTo=${assignedTo}` : '/tasks';
      api.get<Task[]>(path).then(callback).catch(err => console.error('Error fetching tasks:', err));
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  },

  getAllTasks: async (): Promise<Task[]> => {
    return api.get<Task[]>('/tasks');
  },

  getTasksByEmployee: async (employeeId: string): Promise<Task[]> => {
    return api.get<Task[]>(`/tasks?assignedTo=${employeeId}`);
  },

  addTask: async (task: Omit<Task, 'id'>): Promise<string> => {
    const result = await api.post<{ id: string }>('/tasks', task as unknown as Record<string, unknown>);
    return result.id;
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<void> => {
    await api.put(`/tasks/${id}`, data as unknown as Record<string, unknown>);
  },

  updateTaskStatus: async (id: string, status: Task['status']): Promise<void> => {
    await api.put(`/tasks/${id}`, { status } as unknown as Record<string, unknown>);
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.del(`/tasks/${id}`);
  },
};
