import { api } from '../lib/api';
import { CompanySettings, UserSettings } from '../types';

const POLL_INTERVAL = 30000;

export const settingsService = {
  getCompanySettings: async (): Promise<CompanySettings | null> => {
    try {
      const data = await api.get('/settings/company');
      return data as CompanySettings;
    } catch {
      return null;
    }
  },

  updateCompanySettings: async (settings: Partial<CompanySettings>): Promise<void> => {
    await api.put('/settings/company', settings);
  },

  getUserSettings: async (uid: string): Promise<UserSettings | null> => {
    try {
      const data = await api.get('/settings/user/' + uid);
      return data as UserSettings;
    } catch {
      return null;
    }
  },

  updateUserSettings: async (uid: string, settings: Partial<UserSettings>): Promise<void> => {
    await api.put('/settings/user/' + uid, settings);
  },

  subscribeToCompanySettings: (callback: (settings: CompanySettings) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/settings/company');
        if (data) callback(data as CompanySettings);
      } catch (err) {
        console.error('Error fetching company settings:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }
};
