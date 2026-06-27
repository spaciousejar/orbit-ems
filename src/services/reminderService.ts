import { api } from '../lib/api';
import { Reminder } from '../types';

const POLL_INTERVAL = 30000;

export const reminderService = {
  subscribeToReminders: (userId: string, callback: (reminders: Reminder[]) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/reminders', { userId });
        callback(data as Reminder[]);
      } catch (err) {
        console.error('Error fetching reminders:', err);
        callback([]);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },
  addReminder: async (reminder: Omit<Reminder, 'id' | 'createdAt'>) => {
    await api.post('/reminders', {
      ...reminder,
      read: false
    });
  },
  markAsRead: async (id: string) => {
    await api.put('/reminders/' + id + '/read');
  },
  markAllAsRead: async (userId: string) => {
    await api.post('/reminders/mark-all-read', { userId });
  },
  deleteReminder: async (id: string) => {
    await api.del('/reminders/' + id);
  },
  clearAll: async (userId: string) => {
    await api.post('/reminders/clear-all', { userId });
  }
};
