import { api } from '../lib/api';

export interface AuditLog {
  id?: string;
  action: string;
  performedBy: string;
  performedById: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  timestamp: string;
}

const POLL_INTERVAL = 30000;

export const auditService = {
  logAction: async (
    action: string,
    targetId?: string,
    targetName?: string,
    details?: string
  ): Promise<void> => {
    try {
      await api.post('/audit', { action, targetId, targetName, details, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('Error recording audit log:', err);
    }
  },

  subscribeToLogs: (callback: (logs: AuditLog[]) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/audit');
        callback(data as AuditLog[]);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }
};
