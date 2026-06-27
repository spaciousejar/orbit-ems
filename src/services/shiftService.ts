import { api } from '../lib/api';
import { ShiftSchedule, ShiftSwapRequest } from '../types';

const POLL_INTERVAL = 30000;

export const shiftService = {
  subscribeToShifts: (employeeId: string | null, callback: (shifts: ShiftSchedule[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/shifts/shifts', params);
        callback(data as ShiftSchedule[]);
      } catch (err) {
        console.error('Error fetching shifts:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  assignShift: async (shift: Omit<ShiftSchedule, 'id'>): Promise<string> => {
    const data = await api.post('/shifts/shifts', shift);
    return (data as any).id;
  },

  deleteShift: async (id: string): Promise<void> => {
    await api.del('/shifts/shifts/' + id);
  },

  subscribeToSwaps: (employeeId: string | null, callback: (swaps: ShiftSwapRequest[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { targetEmployeeId: employeeId } : {};
        const data = await api.get('/shifts/swaps', params);
        callback(data as ShiftSwapRequest[]);
      } catch (err) {
        console.error('Error fetching swaps:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  requestSwap: async (swap: Omit<ShiftSwapRequest, 'id'>): Promise<string> => {
    const data = await api.post('/shifts/swaps', swap);
    return (data as any).id;
  },

  approveSwap: async (swapId: string, reqShiftId: string, targetShiftId: string, reqEmpId: string, targetEmpId: string, reqEmpName: string, targetEmpName: string): Promise<void> => {
    await api.put('/shifts/swaps/' + swapId + '/approve', { reqShiftId, targetShiftId, reqEmpId, targetEmpId, reqEmpName, targetEmpName });
  },

  rejectSwap: async (swapId: string): Promise<void> => {
    await api.put('/shifts/swaps/' + swapId + '/reject');
  }
};
