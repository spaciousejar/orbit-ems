import { api } from '../lib/api';
import { Attendance } from '../types';

export const attendanceService = {
  subscribeToAttendance: (employeeId: string | null, callback: (records: Attendance[]) => void) => {
    const fetch = () => {
      const path = employeeId ? `/attendance?employeeId=${employeeId}` : '/attendance';
      api.get<Attendance[]>(path).then(callback).catch(err => console.error('Error fetching attendance:', err));
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  },

  getAllAttendance: async (): Promise<Attendance[]> => {
    return api.get<Attendance[]>('/attendance');
  },

  getAttendanceByEmployee: async (employeeId: string): Promise<Attendance[]> => {
    return api.get<Attendance[]>(`/attendance?employeeId=${employeeId}`);
  },

  getAttendanceByDate: async (date: string): Promise<Attendance[]> => {
    return api.get<Attendance[]>(`/attendance?date=${date}`);
  },

  getAttendanceByMonth: async (employeeId: string, month: string): Promise<Attendance[]> => {
    return api.get<Attendance[]>(`/attendance?employeeId=${employeeId}&month=${month}`);
  },

  markAttendance: async (record: Omit<Attendance, 'id'>): Promise<string> => {
    const result = await api.post<{ id: string }>('/attendance', record as unknown as Record<string, unknown>);
    return result.id;
  },

  updateAttendance: async (id: string, record: Partial<Attendance>): Promise<void> => {
    await api.put(`/attendance/${id}`, record as unknown as Record<string, unknown>);
  },

  clockIn: async (employeeId: string, employeeName: string): Promise<string> => {
    const result = await api.post<{ id: string }>('/attendance', {
      employeeId,
      employeeName,
      date: new Date().toISOString().split('T')[0],
      clockIn: new Date().toISOString(),
      status: 'Present',
      uid: employeeId,
    } as unknown as Record<string, unknown>);
    return result.id;
  },

  clockOut: async (id: string): Promise<void> => {
    await api.put(`/attendance/${id}`, { clockOut: new Date().toISOString() } as unknown as Record<string, unknown>);
  },

  getAttendanceForPeriod: async (startDate: string, endDate: string, employeeId?: string): Promise<Attendance[]> => {
    const path = employeeId
      ? `/attendance?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`
      : `/attendance?startDate=${startDate}&endDate=${endDate}`;
    return api.get<Attendance[]>(path);
  },

  deleteAttendance: async (id: string): Promise<void> => {
    await api.del(`/attendance/${id}`);
  },
};
