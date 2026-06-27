import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Calendar,
  History,
  ChevronRight,
  Filter,
  Search,
  Timer,
  Save,
  UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Timesheet, UserProfile, TimesheetEntry, User } from '../types';
import { timesheetService } from '../services/timesheetService';
import { userService } from '../services/userService';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getInitials } from '@/lib/utils';

interface Props {
  profile: UserProfile;
}

export const TimesheetManager: React.FC<Props> = ({ profile }) => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTimesheet, setNewTimesheet] = useState<Partial<Timesheet>>({
    weekStarting: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    entries: Array.from({ length: 5 }, (_, i) => ({
      date: format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'yyyy-MM-dd'),
      hours: 8,
      description: ''
    })),
    status: 'Draft',
    totalHours: 40
  });

  const canManage = profile.role === 'admin' || profile.role === 'hr_manager';

  useEffect(() => {
    const unsubTimesheets = timesheetService.subscribeToTimesheets((data) => {
      setTimesheets(data);
      setIsLoading(false);
    }, canManage ? undefined : (profile.employeeId || profile.uid));
    
    const unsubEmployees = userService.subscribeToUsers(setEmployees);

    return () => {
      unsubTimesheets();
      unsubEmployees();
    };
  }, [profile.employeeId, canManage]);

  const employeePhotoMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    employees.forEach(e => {
      if (e.id) map[e.id] = e.photoURL;
      if (e.uid) map[e.uid] = e.photoURL;
    });
    return map;
  }, [employees]);

  const handleCreateTimesheet = async () => {
    const empId = profile.employeeId || profile.uid;
    if (!empId) return;
    try {
      const totalHours = newTimesheet.entries?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;
      await timesheetService.createTimesheet({
        ...(newTimesheet as Omit<Timesheet, 'id' | 'createdAt' | 'uid'>),
        employeeId: empId,
        employeeName: profile.name || profile.displayName || profile.email || 'Unknown User',
        totalHours
      });
      setIsCreateOpen(false);
      toast.success('Timesheet created successfully');
    } catch (error) {
      toast.error('Failed to create timesheet');
    }
  };

  const handleStatusUpdate = async (id: string, status: Timesheet['status']) => {
    try {
      const managerName = profile.name || profile.displayName || profile.email || 'Manager';
      if (status === 'Approved') {
        await timesheetService.approveTimesheet(id, managerName);
      } else if (status === 'Rejected') {
        await timesheetService.rejectTimesheet(id);
      } else if (status === 'Submitted') {
        await timesheetService.submitTimesheet(id);
      }
      toast.success(`Timesheet ${status.toLowerCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to ${status.toLowerCase()} timesheet`);
    }
  };

  const getStatusBadge = (status: Timesheet['status']) => {
    switch (status) {
      case 'Draft': return <Badge className="bg-zinc-500/10 text-muted-foreground border-zinc-500/20">Draft</Badge>;
      case 'Submitted': return <Badge className="bg-primary/10 text-primary border-primary/20">Submitted</Badge>;
      case 'Approved': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Approved</Badge>;
      case 'Rejected': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Rejected</Badge>;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Timesheets</h1>
          <p className="text-muted-foreground">Manage and track weekly work hours</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Timesheet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <Card className="bg-muted border-border backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{timesheets.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-muted border-border backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {timesheets.filter(t => t.status === 'Submitted').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted border-border backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {timesheets.filter(t => t.status === 'Approved').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted border-border backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {timesheets.reduce((sum, t) => sum + t.totalHours, 0)}h
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted border-border backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">Timesheet History</CardTitle>
                <CardDescription className="text-muted-foreground">View and manage timesheet submissions</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground pl-6">Employee</TableHead>
                <TableHead className="text-muted-foreground">Week Starting</TableHead>
                <TableHead className="text-muted-foreground">Total Hours</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {timesheets.map((ts) => (
                  <motion.tr 
                    key={ts.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border-border hover:bg-accent transition-colors group"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={employeePhotoMap[ts.employeeId]} alt={ts.employeeName} />
                          <AvatarFallback className="bg-muted text-muted-foreground border border-border text-[10px] font-bold">
                            {getInitials(ts.employeeName) || <UserIcon className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{ts.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {format(parseISO(ts.weekStarting), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono font-bold">
                      {ts.totalHours}h
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ts.status)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        {ts.status === 'Draft' && ts.employeeId === profile.employeeId && (
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 h-8"
                            onClick={() => ts.id && handleStatusUpdate(ts.id, 'Submitted')}
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Submit
                          </Button>
                        )}
                        {ts.status === 'Submitted' && canManage && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                              onClick={() => ts.id && handleStatusUpdate(ts.id, 'Approved')}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white"
                              onClick={() => ts.id && handleStatusUpdate(ts.id, 'Rejected')}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1.5" />
                              Reject
                            </Button>
                          </>
                        )}
                        {ts.status !== 'Draft' && (!canManage || ts.status !== 'Submitted') && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold border-border/50">
                            Processed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {timesheets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No timesheets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Timesheet Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">New Weekly Timesheet</DialogTitle>
            <CardDescription>Enter your hours for the week starting {newTimesheet.weekStarting}</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              {newTimesheet.entries?.map((entry, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 items-center p-3 bg-muted rounded-lg border border-border/50">
                  <div className="text-sm font-medium text-foreground">
                    {format(parseISO(entry.date), 'EEEE, MMM dd')}
                  </div>
                  <div className="col-span-1">
                    <Input 
                      type="number" 
                      value={entry.hours}
                      onChange={(e) => {
                        const entries = [...(newTimesheet.entries || [])];
                        entries[index].hours = parseFloat(e.target.value);
                        setNewTimesheet({ ...newTimesheet, entries });
                      }}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      placeholder="Description of work..."
                      value={entry.description}
                      onChange={(e) => {
                        const entries = [...(newTimesheet.entries || [])];
                        entries[index].description = e.target.value;
                        setNewTimesheet({ ...newTimesheet, entries });
                      }}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Weekly Hours</div>
              <div className="text-2xl font-bold text-primary">
                {newTimesheet.entries?.reduce((sum, e) => sum + (e.hours || 0), 0)}h
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={handleCreateTimesheet} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
