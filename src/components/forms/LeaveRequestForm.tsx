import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { leaveService } from '../../services/leaveService';
import { LeaveType, UserProfile } from '../../types';
import { toast } from 'sonner';

interface Props {
  profile: UserProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

const LEAVE_TYPES: LeaveType[] = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid'];

export function LeaveRequestForm({ profile, onSuccess, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'Annual' as LeaveType,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setLoading(true);
    try {
      await leaveService.requestLeave({
        employeeId: profile.employeeId || profile.uid,
        employeeName: profile.displayName || profile.email || 'Unknown User',
        uid: profile.uid,
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
        reason: formData.reason,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      });
      toast.success('Leave request submitted successfully');
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            required
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="bg-muted border-border text-foreground focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">End Date</Label>
          <Input
            id="endDate"
            type="date"
            required
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="bg-muted border-border text-foreground focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Leave Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value ?? 'Annual' })}
        >
          <SelectTrigger className="bg-muted border-border text-foreground focus:ring-ring">
            <SelectValue placeholder="Select leave type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            {LEAVE_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="hover:bg-accent cursor-pointer">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Reason (Optional)</Label>
        <Textarea
          id="reason"
          placeholder="Briefly explain the reason for your leave..."
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          className="bg-muted border-border text-foreground focus-visible:ring-ring min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground hover:bg-accent">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-lg shadow-primary/20">
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}
