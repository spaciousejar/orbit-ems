import { api } from '../lib/api';
import { User } from '../types';

export const userService = {
  subscribeToUsers: (callback: (users: User[]) => void, departmentId?: string | null) => {
    const fetch = () => {
      const path = departmentId ? `/users?departmentId=${departmentId}` : '/users';
      api.get<User[]>(path).then(callback).catch(err => console.error('Error fetching users:', err));
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  },

  getAllUsers: async (): Promise<User[]> => {
    return api.get<User[]>('/users');
  },

  getUserById: async (id: string): Promise<User> => {
    return api.get<User>(`/users/${id}`);
  },

  addUser: async (user: Omit<User, 'id'>): Promise<string> => {
    const result = await api.post<{ id: string }>('/users', user as unknown as Record<string, unknown>);
    return result.id;
  },

  updateUser: async (id: string, user: Partial<User>): Promise<void> => {
    await api.put(`/users/${id}`, user as unknown as Record<string, unknown>);
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.del(`/users/${id}`);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const users = await api.get<User[]>('/users', { email });
    return users[0] || null;
  },

  createUserProfile: async (uid: string, profile: Omit<User, 'id'>): Promise<{ id: string }> => {
    return api.post<{ id: string }>('/users', { ...profile, id: uid, uid });
  },
};
