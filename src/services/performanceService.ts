import { api } from '../lib/api';
import { Goal, PerformanceAppraisal } from '../types';

const POLL_INTERVAL = 30000;

export const performanceService = {
  subscribeToGoals: (employeeId: string | null, callback: (goals: Goal[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/performance/goals', params);
        callback(data as Goal[]);
      } catch (err) {
        console.error('Error fetching goals:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  addGoal: async (goal: Omit<Goal, 'id'>): Promise<string> => {
    const data = await api.post('/performance/goals', goal);
    return (data as any).id;
  },

  updateGoalProgress: async (id: string, progress: number, status: Goal['status']): Promise<void> => {
    await api.put('/performance/goals/' + id, { progress, status });
  },

  deleteGoal: async (id: string): Promise<void> => {
    await api.del('/performance/goals/' + id);
  },

  subscribeToAppraisals: (employeeId: string | null, callback: (appraisals: PerformanceAppraisal[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/performance/appraisals', params);
        callback(data as PerformanceAppraisal[]);
      } catch (err) {
        console.error('Error fetching appraisals:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  saveAppraisal: async (appraisal: Omit<PerformanceAppraisal, 'id'> & { id?: string }): Promise<string> => {
    const data = await api.post('/performance/appraisals', appraisal);
    return (data as any).id;
  }
};
