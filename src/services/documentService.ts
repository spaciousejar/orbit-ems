import { api } from '../lib/api';
import { EmployeeDocument } from '../types';

const POLL_INTERVAL = 30000;

export const documentService = {
  subscribeToDocuments: (employeeId: string | null, callback: (docs: EmployeeDocument[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/documents', params);
        callback(data as EmployeeDocument[]);
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  uploadDocument: async (docInfo: Omit<EmployeeDocument, 'id'>): Promise<string> => {
    const data = await api.post('/documents', docInfo);
    return (data as any).id;
  },

  updateDocumentStatus: async (id: string, status: EmployeeDocument['status']): Promise<void> => {
    await api.put('/documents/' + id, { status });
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.del('/documents/' + id);
  }
};
