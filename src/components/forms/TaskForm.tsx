import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatus, TaskPriority, User, Task } from '../../types';
import { taskService } from '../../services/taskService';
import { userService } from '../../services/userService';
import { auth } from '../../firebase';
import { toast } from 'sonner';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  task?: Task; // Optional task for editing
}

export function TaskForm({ onSuccess, onCancel, task }: Props) {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo || '',
    dueDate: task?.dueDate || '',
    priority: (task?.priority || 'Medium') as TaskPriority,
    status: (task?.status || 'Todo') as TaskStatus
  });

  useEffect(() => {
    const unsub = userService.subscribeToUsers((emps) => {
      setEmployees(emps);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assignedTo) {
      toast.error('Please assign the task to an employee');
      return;
    }

    setLoading(true);
    try {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!task && selectedDate < today) {
        toast.error('Due date cannot be in the past');
        setLoading(false);
        return;
      }

      const assignedEmployee = employees.find(emp => emp.id === formData.assignedTo);
      const taskData = {
        ...formData,
        assignedToName: assignedEmployee ? `${assignedEmployee.firstName} ${assignedEmployee.lastName}` : 'Unknown',
        createdBy: auth.currentUser?.uid || '',
        createdAt: new Date().toISOString()
      };

      if (task?.id) {
        await taskService.updateTask(task.id, taskData);
        toast.success('Task updated successfully');
      } else {
        await taskService.addTask(taskData);
        toast.success('Task created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(task ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input 
          id="title" 
          required 
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="bg-card border-border text-white"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input 
          id="description" 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-card border-border text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assign To</Label>
          <Select 
            value={formData.assignedTo} 
            onValueChange={(val) => setFormData({ ...formData, assignedTo: val ?? '' })}
            disabled={employees.length === 0}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder={employees.length === 0 ? "Loading employees..." : "Select employee"} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-white">
              {employees
                .filter(emp => emp.firstName || emp.lastName)
                .map((emp) => (
                  <SelectItem key={emp.id} value={emp.id!}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input 
            id="dueDate" 
            type="date" 
            required 
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="bg-card border-border text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(val) => setFormData({ ...formData, priority: val ?? 'Medium' })}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-white">
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(val) => setFormData({ ...formData, status: val ?? 'Todo' })}
          >
            <SelectTrigger className="bg-card border-border text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-white">
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-muted-foreground hover:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          {loading ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
