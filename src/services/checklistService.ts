import { api } from '../lib/api';
import { OnboardingProcess, OffboardingProcess } from '../types';

const POLL_INTERVAL = 30000;

export const checklistService = {
  async createOnboarding(process: Omit<OnboardingProcess, 'id'>) {
    const data = await api.post('/checklist/onboarding', process);
    return { id: (data as any).id };
  },

  async updateOnboarding(id: string, updates: Partial<OnboardingProcess>) {
    await api.put('/checklist/onboarding/' + id, updates);
  },

  subscribeToOnboarding(callback: (processes: OnboardingProcess[]) => void) {
    const fetchData = async () => {
      try {
        const data = await api.get('/checklist/onboarding');
        callback(data as OnboardingProcess[]);
      } catch (err) {
        console.error('Error fetching onboarding processes:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  async deleteOnboarding(id: string) {
    await api.del('/checklist/onboarding/' + id);
  },

  async createOffboarding(process: Omit<OffboardingProcess, 'id'>) {
    const data = await api.post('/checklist/offboarding', process);
    return { id: (data as any).id };
  },

  async updateOffboarding(id: string, updates: Partial<OffboardingProcess>) {
    await api.put('/checklist/offboarding/' + id, updates);
  },

  subscribeToOffboarding(callback: (processes: OffboardingProcess[]) => void) {
    const fetchData = async () => {
      try {
        const data = await api.get('/checklist/offboarding');
        callback(data as OffboardingProcess[]);
      } catch (err) {
        console.error('Error fetching offboarding processes:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  async deleteOffboarding(id: string) {
    await api.del('/checklist/offboarding/' + id);
  }
};
