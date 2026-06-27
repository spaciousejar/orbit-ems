import { api } from '../lib/api';
import { Course, CourseNomination } from '../types';

const POLL_INTERVAL = 30000;

export const trainingService = {
  subscribeToCourses: (callback: (courses: Course[]) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/training/courses');
        callback(data as Course[]);
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  addCourse: async (course: Omit<Course, 'id'>): Promise<string> => {
    const data = await api.post('/training/courses', course);
    return (data as any).id;
  },

  subscribeToNominations: (employeeId: string | null, callback: (noms: CourseNomination[]) => void) => {
    const fetchData = async () => {
      try {
        const params = employeeId ? { employeeId } : {};
        const data = await api.get('/training/nominations', params);
        callback(data as CourseNomination[]);
      } catch (err) {
        console.error('Error fetching nominations:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },

  nominateEmployee: async (nom: Omit<CourseNomination, 'id'>): Promise<string> => {
    const data = await api.post('/training/nominations', nom);
    return (data as any).id;
  },

  updateNominationStatus: async (id: string, status: CourseNomination['status'], feedback?: string): Promise<void> => {
    const payload: any = { status };
    if (feedback) payload.feedback = feedback;
    await api.put('/training/nominations/' + id, payload);
  }
};
