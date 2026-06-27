import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { toast } from 'sonner';

interface Props {
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Legal'];

function getNameParts(user?: User): { firstName: string; lastName: string } {
  if (user?.firstName && user?.lastName) {
    return { firstName: user.firstName, lastName: user.lastName };
  }
  if (user?.displayName) {
    const parts = user.displayName.split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    };
  }
  return { firstName: '', lastName: '' };
}

export function UserForm({ user, onSuccess, onCancel }: Props) {
  const nameParts = getNameParts(user);
  const [formData, setFormData] = useState<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'uid' | 'name'>>({
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    email: user?.email || '',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    role: user?.role || 'employee',
    status: user?.status || 'Active',
    photoURL: user?.photoURL || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department) {
      toast.error('Please select a department');
      return;
    }
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }
    setLoading(true);
    try {
      if (user?.id) {
        await userService.updateUser(user.id, formData);
        toast.success('User updated successfully');
      } else {
        await userService.addUser({
          ...formData,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          uid: formData.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast.success('User added successfully');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">First Name</Label>
          <Input
            id="firstName"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="bg-muted border-border text-foreground focus-visible:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Last Name</Label>
          <Input
            id="lastName"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="bg-muted border-border text-foreground focus-visible:ring-primary"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-muted border-border text-foreground focus-visible:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="bg-muted border-border text-foreground focus-visible:ring-primary"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="photoURL" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Profile Photo URL</Label>
        <Input
          id="photoURL"
          placeholder="https://example.com/photo.jpg"
          value={formData.photoURL}
          onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
          className="bg-muted border-border text-foreground focus-visible:ring-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jobTitle" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Job Title</Label>
          <Input
            id="jobTitle"
            required
            value={formData.jobTitle}
            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
            className="bg-muted border-border text-foreground focus-visible:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Department</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData({ ...formData, department: value ?? '' })}
          >
            <SelectTrigger className="bg-muted border-border text-foreground focus:ring-primary">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept} className="hover:bg-accent cursor-pointer">
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">User Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value ?? 'Active' })}
          >
            <SelectTrigger className="bg-muted border-border text-foreground focus:ring-primary">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="Active" className="hover:bg-accent cursor-pointer">Active</SelectItem>
              <SelectItem value="Inactive" className="hover:bg-accent cursor-pointer">Inactive</SelectItem>
              <SelectItem value="On Leave" className="hover:bg-accent cursor-pointer">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role" className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">System Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value ?? 'employee' })}
          >
            <SelectTrigger className="bg-muted border-border text-foreground focus:ring-primary">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="admin" className="hover:bg-accent cursor-pointer">Admin</SelectItem>
              <SelectItem value="hr_manager" className="hover:bg-accent cursor-pointer">HR Manager</SelectItem>
              <SelectItem value="team_lead" className="hover:bg-accent cursor-pointer">Team Lead</SelectItem>
              <SelectItem value="employee" className="hover:bg-accent cursor-pointer">Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-foreground hover:bg-accent">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-lg shadow-primary/20">
          {loading ? 'Saving...' : user ? 'Update User' : 'Add User'}
        </Button>
      </div>
    </form>
  );
}
