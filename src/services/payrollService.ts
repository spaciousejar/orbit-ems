import { api } from '../lib/api';
import { SalaryStructure, PayrollRun, SalarySlip } from '../types';

const POLL_INTERVAL = 30000;

export const payrollService = {
  getSalaryStructure: async (employeeId: string): Promise<SalaryStructure | null> => {
    try {
      const data = await api.get('/payroll/salary-structures/' + employeeId);
      return data as SalaryStructure;
    } catch {
      return null;
    }
  },

  saveSalaryStructure: async (structure: Omit<SalaryStructure, 'id'> & { id?: string }): Promise<void> => {
    await api.post('/payroll/salary-structures', structure);
  },

  subscribeToPayrollRuns: (callback: (runs: PayrollRun[]) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/payroll/payroll-runs');
        callback(data as PayrollRun[]);
      } catch (err) {
        console.error('Error fetching payroll runs:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  createPayrollRun: async (run: Omit<PayrollRun, 'id'>): Promise<string> => {
    const data = await api.post('/payroll/payroll-runs', run);
    return (data as any).id;
  },

  updatePayrollRunStatus: async (id: string, status: PayrollRun['status']): Promise<void> => {
    await api.put('/payroll/payroll-runs/' + id, { status });
  },

  subscribeToSalarySlips: (employeeId: string | null, callback: (slips: SalarySlip[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/payroll/salary-slips', params);
        callback(data as SalarySlip[]);
      } catch (err) {
        console.error('Error fetching salary slips:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  createSalarySlipsBatch: async (slips: Omit<SalarySlip, 'id'>[]): Promise<void> => {
    await api.post('/payroll/salary-slips/batch', { slips });
  },

  markSalarySlipPaid: async (id: string): Promise<void> => {
    await api.put('/payroll/salary-slips/' + id + '/pay');
  }
};
