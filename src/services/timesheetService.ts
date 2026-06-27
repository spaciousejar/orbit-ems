import { api } from '../lib/api';
import { Timesheet } from '../types';

const POLL_INTERVAL = 30000;

export const timesheetService = {
  subscribeToTimesheets: (callback: (timesheets: Timesheet[]) => void, employeeId?: string) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/timesheets', params);
        callback(data as Timesheet[]);
      } catch (err) {
        console.error('Error fetching timesheets:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  createTimesheet: async (timesheet: Omit<Timesheet, 'id' | 'createdAt' | 'uid'>) => {
    try {
      return await api.post('/timesheets', timesheet);
    } catch (err) {
      throw err;
    }
  },

  updateTimesheet: async (id: string, updates: Partial<Timesheet>) => {
    try {
      return await api.put('/timesheets/' + id, updates);
    } catch (err) {
      throw err;
    }
  },

  submitTimesheet: async (id: string) => {
    try {
      return await api.put('/timesheets/' + id + '/submit');
    } catch (err) {
      throw err;
    }
  },

  approveTimesheet: async (id: string, approvedBy: string) => {
    try {
      return await api.put('/timesheets/' + id + '/approve', { approvedBy });
    } catch (err) {
      throw err;
    }
  },

  rejectTimesheet: async (id: string) => {
    try {
      return await api.put('/timesheets/' + id + '/reject');
    } catch (err) {
      throw err;
    }
  }
};
