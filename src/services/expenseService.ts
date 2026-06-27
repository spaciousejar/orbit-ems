import { api } from '../lib/api';
import { ExpenseClaim } from '../types';

const POLL_INTERVAL = 30000;

export const expenseService = {
  subscribeToExpenses: (employeeId: string | null, callback: (expenses: ExpenseClaim[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/expenses', params);
        callback(data as ExpenseClaim[]);
      } catch (err) {
        console.error('Error fetching expenses:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  submitExpense: async (claim: Omit<ExpenseClaim, 'id'>): Promise<string> => {
    const data = await api.post('/expenses', claim);
    return (data as any).id;
  },

  updateExpenseStatus: async (
    id: string,
    status: ExpenseClaim['status'],
    approvedById: string,
    approvedByName: string
  ): Promise<void> => {
    await api.put('/expenses/' + id, { status, approvedBy: approvedById, approvedByName });
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.del('/expenses/' + id);
  }
};
