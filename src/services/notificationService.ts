import { api } from '../lib/api';
import { Notification } from '../types';

const POLL_INTERVAL = 30000;

export const notificationService = {
  subscribeToNotifications: (userId: string, callback: (notifications: Notification[]) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/notifications', { userId });
        callback(data as Notification[]);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        callback([]);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },
  markAsRead: async (id: string) => {
    await api.put('/notifications/' + id, { read: true });
  },
  markAllAsRead: async (userId: string) => {
    await api.post('/notifications/mark-all-read', { userId });
  },
  deleteNotification: async (id: string) => {
    await api.del('/notifications/' + id);
  },
  clearAll: async (userId: string) => {
    await api.post('/notifications/clear-all', { userId });
  },
  addNotification: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'type'> & { type?: Notification['type'] }) => {
    await api.post('/notifications', {
      ...notification,
      type: notification.type || 'info',
    });
  },
  notifyManagers: async (message: string) => {
    await api.post('/notifications/notify-managers', { message });
  }
};
