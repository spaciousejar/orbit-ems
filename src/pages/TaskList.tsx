import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Plus, 
  Search, 
  Trash2,
  AlertCircle,
  Bell,
  Edit
} from 'lucide-react';
import { Task, UserProfile, TaskStatus, TaskPriority } from '../types';
import { taskService } from '../services/taskService';
import { reminderService } from '../services/reminderService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '../components/forms/TaskForm';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';

interface Props {
  profile: UserProfile;
}

export function TaskList({ profile }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const canManage = profile.role === 'admin' || profile.role === 'hr_manager' || profile.role === 'team_lead';

  useEffect(() => {
    const unsubTasks = taskService.subscribeToTasks(profile.employeeId || profile.uid, (allTasks) => {
      setTasks(allTasks);
      setLoading(false);
    });
    
    return () => unsubTasks();
  }, [profile.uid, profile.role, profile.employeeId]);

  const handleStatusUpdate = async (id: string, status: TaskStatus) => {
    try {
      await taskService.updateTask(id, { status });
      toast.success(`Task marked as ${status.toLowerCase()}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update task status');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete task');
    }
  };

  const handleSetReminder = async (task: Task) => {
    try {
      const reminderTime = new Date(new Date(task.dueDate).getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours before
      await reminderService.addReminder({
        userId: profile.uid,
        type: 'task',
        relatedId: task.id!,
        reminderTime,
        message: `Upcoming task deadline: ${task.title}`,
        read: false
      });
      toast.success('Reminder set for 2 hours before deadline');
    } catch (error) {
      console.error(error);
      toast.error('Failed to set reminder');
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-brand-emerald border-emerald-500/20';
      case 'In Progress':
        return 'bg-blue-500/10 text-primary border-primary/20';
      case 'Todo':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-zinc-500/10 text-muted-foreground border-zinc-500/20';
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Low':
        return 'bg-emerald-500/10 text-brand-emerald border-emerald-500/20';
      default:
        return 'bg-zinc-500/10 text-muted-foreground border-zinc-500/20';
    }
  };

  const filteredData = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Tasks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your tasks and set reminders for deadlines.
          </p>
        </div>
        {canManage && (
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-9 bg-card border-border text-foreground focus-visible:ring-ring"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? '')}>
            <SelectTrigger className="bg-card border-border text-foreground focus:ring-ring">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Todo">Todo</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-card/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium h-12">Task</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Assigned To</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12 text-center">Priority</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Due Date</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Status</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium h-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Loading tasks...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 opacity-20 mb-2" />
                    <p>No tasks found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((task) => (
                <TableRow key={task.id} className="border-border hover:bg-accent transition-colors group">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{task.title}</span>
                      {task.description && (
                        <span className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">
                          {task.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.assignedToName}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("font-normal", getPriorityBadge(task.priority))}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{format(parseISO(task.dueDate), 'MMM dd, yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-normal", getStatusBadge(task.status))}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {task.status !== 'Completed' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-brand-emerald hover:bg-emerald-500/10"
                          onClick={() => setTaskToComplete(task)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      
                      {task.status !== 'Completed' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-primary hover:bg-primary/10"
                          onClick={() => handleSetReminder(task)}
                          title="Set Reminder"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {canManage && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-primary hover:bg-primary/10"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {canManage && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-rose-500 hover:bg-rose-500/10"
                          onClick={() => task.id && handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen || !!editingTask} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingTask(null);
        }
      }}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm 
            task={editingTask || undefined}
            onSuccess={() => {
              setIsAddDialogOpen(false);
              setEditingTask(null);
            }}
            onCancel={() => {
              setIsAddDialogOpen(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskToComplete} onOpenChange={() => setTaskToComplete(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Confirm Completion</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to mark "{taskToComplete?.title}" as completed?
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setTaskToComplete(null)}>Cancel</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (taskToComplete?.id) {
                  handleStatusUpdate(taskToComplete.id, 'Completed');
                  setTaskToComplete(null);
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
