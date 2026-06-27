import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobPosting, Applicant } from '../types';
import { recruitmentService } from '../services/recruitmentService';
import { toast } from 'sonner';

export function RecruitmentManager() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: '', description: '' });
  const [applicants, setApplicants] = useState<Record<string, Applicant[]>>({});

  useEffect(() => {
    return recruitmentService.subscribeToJobs(setJobs);
  }, []);

  useEffect(() => {
    jobs.forEach(job => {
      if (job.id) {
        recruitmentService.subscribeToApplicants(job.id, (jobApplicants) => {
          setApplicants(prev => ({ ...prev, [job.id!]: jobApplicants }));
        });
      }
    });
  }, [jobs]);

  const handleAddJob = async () => {
    if (!newJob.title || !newJob.department || !newJob.description) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await recruitmentService.addJob({ ...newJob, status: 'Open' });
      toast.success('Job posting added');
      setIsDialogOpen(false);
      setNewJob({ title: '', department: '', description: '' });
    } catch (error) {
      toast.error('Failed to add job posting');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Recruitment</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-white shadow hover:bg-primary/90 h-8 px-4 py-2">
            Add Job Posting
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Add New Job Posting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="bg-card border-border" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select 
                  value={newJob.department} 
                  onValueChange={(val) => setNewJob({...newJob, department: val ?? ''})}
                >
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="bg-card border-border" />
              </div>
              <Button onClick={handleAddJob} className="w-full bg-primary hover:bg-primary/90">Add Job</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {jobs.map(job => (
          <Card key={job.id} className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{job.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{job.department}</p>
              <p className="text-muted-foreground text-sm mt-2">{job.description}</p>
              <div className="mt-4">
                <h4 className="text-foreground font-semibold">Applicants ({applicants[job.id!]?.length || 0})</h4>
                <ul className="mt-2 space-y-1">
                  {applicants[job.id!]?.map(applicant => (
                    <li key={applicant.id} className="text-muted-foreground text-sm">{applicant.name} - {applicant.status}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
