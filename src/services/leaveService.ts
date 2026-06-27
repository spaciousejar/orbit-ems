import { api } from '../lib/api';
import { LeaveRequest } from '../types';

export const leaveService = {
  subscribeToLeaves: (employeeId: string | null, callback: (leaves: LeaveRequest[]) => void) => {
    const fetch = () => {
      const path = employeeId ? `/leaves?employeeId=${employeeId}` : '/leaves';
      api.get<LeaveRequest[]>(path).then(callback).catch(err => console.error('Error fetching leaves:', err));
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  },

  subscribeToLeaveRequests: (callback: (leaves: LeaveRequest[]) => void) => {
    return leaveService.subscribeToLeaves(null, callback);
  },

  getAllLeaves: async (): Promise<LeaveRequest[]> => {
    return api.get<LeaveRequest[]>('/leaves');
  },

  getLeavesByEmployee: async (employeeId: string): Promise<LeaveRequest[]> => {
    return api.get<LeaveRequest[]>(`/leaves?employeeId=${employeeId}`);
  },

  requestLeave: async (leave: Omit<LeaveRequest, 'id'>): Promise<string> => {
    const result = await api.post<{ id: string }>('/leaves', leave as unknown as Record<string, unknown>);
    return result.id;
  },

  updateLeaveStatus: async (id: string, status: string, approvedBy?: string, approvedByName?: string): Promise<void> => {
    const body: Record<string, unknown> = { status };
    if (approvedBy) body.approvedBy = approvedBy;
    if (approvedByName) body.approvedByName = approvedByName;
    await api.put(`/leaves/${id}`, body);
  },

  deleteLeave: async (id: string): Promise<void> => {
    await api.del(`/leaves/${id}`);
  },
};
