import { api } from '../lib/api';
import { JobPosting, Applicant } from '../types';

const POLL_INTERVAL = 30000;

export const recruitmentService = {
  subscribeToJobs: (callback: (jobs: JobPosting[]) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/recruitment/jobs');
        callback(data as JobPosting[]);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        callback([]);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },
  addJob: async (job: Omit<JobPosting, 'id' | 'createdAt'>) => {
    await api.post('/recruitment/jobs', job);
  },
  subscribeToApplicants: (jobId: string, callback: (applicants: Applicant[]) => void) => {
    const fetchData = async () => {
      try {
        const data = await api.get('/recruitment/applicants', { jobId });
        callback(data as Applicant[]);
      } catch (err) {
        console.error('Error fetching applicants:', err);
        callback([]);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  },
  addApplicant: async (applicant: Omit<Applicant, 'id' | 'createdAt'>) => {
    await api.post('/recruitment/applicants', applicant);
  }
};
