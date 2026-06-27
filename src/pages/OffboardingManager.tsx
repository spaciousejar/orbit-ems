import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle, 
  Clock, 
  UserMinus, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OffboardingProcess, User, ChecklistItem } from '../types';
import { checklistService } from '../services/checklistService';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const DEFAULT_OFFBOARDING_TASKS = [
  "Return IT Equipment (Laptop, Phone, etc.)",
  "Handover Access Card/Keys",
  "Exit Interview Completion",
  "Deactivate System Access (Email, Slack, etc.)",
  "Final Salary Settlement",
  "Knowledge Transfer Session",
  "Remove from Company Directory",
  "Update HR Records"
];

export function OffboardingManager() {
  const [processes, setProcesses] = useState<OffboardingProcess[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProcesses = checklistService.subscribeToOffboarding(setProcesses);
    const unsubEmployees = userService.subscribeToUsers((data) => {
      setEmployees(data.filter(e => e.status === 'Active'));
      setLoading(false);
    });

    return () => {
      unsubProcesses();
      unsubEmployees();
    };
  }, []);

  const handleStartOffboarding = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee');
      return;
    }

    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    const existing = processes.find(p => p.employeeId === selectedEmployeeId && p.status === 'In Progress');
    if (existing) {
      toast.error('Offboarding already in progress for this employee');
      return;
    }

    const newProcess: Omit<OffboardingProcess, 'id'> = {
      employeeId: employee.id!,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      lastWorkingDay,
      status: 'In Progress',
      reason,
      items: DEFAULT_OFFBOARDING_TASKS.map((task, index) => ({
        id: `task-${Date.now()}-${index}`,
        title: task,
        status: 'Pending'
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await checklistService.createOffboarding(newProcess);
      toast.success('Offboarding process started');
      setIsAddDialogOpen(false);
      setSelectedEmployeeId('');
      setReason('');
    } catch (error) {
      toast.error('Failed to start offboarding');
    }
  };

  const toggleTask = async (process: OffboardingProcess, taskId: string) => {
    const updatedItems = process.items.map(item => {
      if (item.id === taskId) {
        return {
          ...item,
          status: item.status === 'Completed' ? 'Pending' : 'Completed',
          completedAt: item.status === 'Pending' ? new Date().toISOString() : undefined
        } as ChecklistItem;
      }
      return item;
    });

    const allCompleted = updatedItems.every(item => item.status === 'Completed');
    
    try {
      await checklistService.updateOffboarding(process.id!, {
        items: updatedItems,
        status: allCompleted ? 'Completed' : 'In Progress'
      });
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this offboarding process?')) {
      try {
        await checklistService.deleteOffboarding(id);
        toast.success('Process deleted');
      } catch (error) {
        toast.error('Failed to delete process');
      }
    }
  };

  const filteredProcesses = processes.filter(p => 
    p.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Offboarding</h1>
          <p className="text-muted-foreground text-sm">Manage employee departures and checklists.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search employees..." 
              className="pl-9 w-64 bg-muted border-border text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Start Offboarding
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProcesses.map((process) => {
            const completedCount = process.items.filter(i => i.status === 'Completed').length;
            const progress = (completedCount / process.items.length) * 100;

            return (
              <motion.div
                key={process.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="bg-card border-border overflow-hidden group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-foreground flex items-center gap-2">
                          {process.employeeName}
                          {process.status === 'Completed' && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Last Day: {new Date(process.lastWorkingDay).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          process.status === 'In Progress' ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                        )}>
                          {process.status}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(process.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {process.reason && (
                      <div className="p-3 bg-muted rounded-lg border border-border flex gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          "{process.reason}"
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Completion Progress</span>
                        <span className="text-foreground font-medium">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-red-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist Items</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {process.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => toggleTask(process, item.id)}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg text-sm transition-all text-left",
                              item.status === 'Completed' 
                                ? "bg-success/5 text-muted-foreground" 
                                : "hover:bg-accent text-foreground"
                            )}
                          >
                            {item.status === 'Completed' ? (
                              <CheckCircle className="h-4 w-4 text-success shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={cn(item.status === 'Completed' && "line-through opacity-50")}>
                              {item.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

          {filteredProcesses.length === 0 && !loading && (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            <UserMinus className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">No offboarding processes</h3>
            <p className="text-sm">Start a new offboarding process for a departing employee.</p>
          </div>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Start Offboarding</DialogTitle>
            <DialogDescription>
              Initialize the departure process for an employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Team Member</Label>
              <Select value={selectedEmployeeId} onValueChange={(v) => setSelectedEmployeeId(v ?? '')}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {employees
                    .filter(e => !processes.some(p => p.employeeId === e.id && p.status === 'In Progress'))
                    .map(employee => (
                      <SelectItem key={employee.id} value={employee.id!}>
                        {employee.firstName} {employee.lastName} - {employee.jobTitle}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Last Working Day</Label>
              <Input 
                type="date" 
                value={lastWorkingDay} 
                onChange={(e) => setLastWorkingDay(e.target.value)}
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason for Departure (Optional)</Label>
              <Input 
                placeholder="Resignation, Retirement, etc." 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                className="bg-card border-border"
              />
            </div>
            <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/10 flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will create a standard offboarding checklist with {DEFAULT_OFFBOARDING_TASKS.length} tasks for the selected employee.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStartOffboarding} className="bg-red-600 hover:bg-red-700">
              Create Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
