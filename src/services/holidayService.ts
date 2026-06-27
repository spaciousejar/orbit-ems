import { api } from '../lib/api';
import { Holiday } from '../types';

export const holidayService = {
  subscribeToHolidays: (year: string | null, callback: (holidays: Holiday[]) => void) => {
    const fetch = () => {
      const path = year ? `/holidays?year=${year}` : '/holidays';
      api.get<Holiday[]>(path).then(callback).catch(err => console.error('Error fetching holidays:', err));
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  },

  getAllHolidays: async (): Promise<Holiday[]> => {
    return api.get<Holiday[]>('/holidays');
  },

  addHoliday: async (holiday: Omit<Holiday, 'id'>): Promise<string> => {
    const result = await api.post<{ id: string }>('/holidays', holiday as unknown as Record<string, unknown>);
    return result.id;
  },

  updateHoliday: async (id: string, holiday: Partial<Holiday>): Promise<void> => {
    await api.put(`/holidays/${id}`, holiday as unknown as Record<string, unknown>);
  },

  deleteHoliday: async (id: string): Promise<void> => {
    await api.del(`/holidays/${id}`);
  },
};
