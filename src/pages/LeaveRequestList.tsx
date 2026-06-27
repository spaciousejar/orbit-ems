import { useState, useEffect, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  UserIcon, 
  Plus, 
  Filter, 
  Search, 
  ChevronRight,
  Info
} from 'lucide-react';
import { LeaveRequest, UserProfile, UserRole, LeaveStatus, User } from '../types';
import { leaveService } from '../services/leaveService';
import { reminderService } from '../services/reminderService';
import { userService } from '../services/userService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LeaveRequestForm } from '../components/forms/LeaveRequestForm';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { getInitials } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';

interface Props {
  profile: UserProfile;
}

export function LeaveRequestList({ profile }: Props) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const canManage = profile.role === 'admin' || profile.role === 'hr_manager';

  useEffect(() => {
    const unsubRequests = leaveService.subscribeToLeaveRequests((allRequests) => {
      // If not admin/hr, filter by current user's uid
      const filtered = canManage 
        ? allRequests 
        : allRequests.filter(r => r.uid === profile.uid);
      setRequests(filtered);
      setLoading(false);
    });
    
    const unsubEmployees = userService.subscribeToUsers(setEmployees);
    
    return () => {
      unsubRequests();
      unsubEmployees();
    };
  }, [canManage, profile.uid]);

  const employeePhotoMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    employees.forEach(e => {
      if (e.id) map[e.id] = e.photoURL;
      if (e.uid) map[e.uid] = e.photoURL;
    });
    return map;
  }, [employees]);

  const handleStatusUpdate = async (id: string, status: LeaveStatus) => {
    try {
      await leaveService.updateLeaveStatus(id, status);
      toast.success(`Request ${status.toLowerCase()} successfully. Automated email notification sent to employee.`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${status.toLowerCase()} request`);
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-brand-emerald border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-zinc-500/10 text-muted-foreground border-zinc-500/20';
    }
  };

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />;
      case 'Rejected':
        return <XCircle className="w-3.5 h-3.5 mr-1.5" />;
      case 'Pending':
        return <Clock className="w-3.5 h-3.5 mr-1.5" />;
      default:
        return null;
    }
  };

  const filteredData = requests.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Leave Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {canManage 
              ? "Manage and review employee leave applications." 
              : "Track and manage your leave applications."}
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search requests..." 
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
              <SelectItem value="All" className="hover:bg-accent">All Status</SelectItem>
              <SelectItem value="Pending" className="hover:bg-accent">Pending</SelectItem>
              <SelectItem value="Approved" className="hover:bg-accent">Approved</SelectItem>
              <SelectItem value="Rejected" className="hover:bg-accent">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-card/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium h-12">Employee</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Type</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Period</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Duration</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium h-12">Reason</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium h-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-border">
                <TableCell colSpan={canManage ? 7 : 6} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Loading requests...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow className="border-border">
                <TableCell colSpan={canManage ? 7 : 6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-8 h-8 opacity-20 mb-2" />
                    <p>No leave requests found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((request) => (
                <TableRow key={request.id} className="border-border hover:bg-accent transition-colors group">
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={employeePhotoMap[request.employeeId]} alt={request.employeeName} />
                        <AvatarFallback className="bg-card text-muted-foreground text-[10px] font-bold">
                          {getInitials(request.employeeName) || <UserIcon className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{request.employeeName}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ID: {request.employeeId.slice(-6)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-card text-muted-foreground border-border font-normal px-2 py-0.5">
                      {request.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <div className="flex flex-col">
                        <span className="text-zinc-100">{format(parseISO(request.startDate), 'MMM dd, yyyy')}</span>
                        <span className="text-muted-foreground text-[10px]">Start Date</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-zinc-700" />
                      <div className="flex flex-col">
                        <span className="text-zinc-100">{format(parseISO(request.endDate), 'MMM dd, yyyy')}</span>
                        <span className="text-muted-foreground text-[10px]">End Date</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-primary">
                        {differenceInDays(parseISO(request.endDate), parseISO(request.startDate)) + 1}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Total Days</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-bold flex items-center w-fit px-2.5 py-1 text-[10px] uppercase tracking-wider border", 
                        getStatusBadge(request.status)
                      )}
                    >
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <p className="text-xs text-muted-foreground line-clamp-2 italic" title={request.reason}>
                      "{request.reason || 'No reason provided'}"
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canManage && request.status === 'Pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 bg-emerald-500/10 border-emerald-500/20 text-brand-emerald hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-bold uppercase"
                            onClick={() => request.id && handleStatusUpdate(request.id, 'Approved')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-bold uppercase"
                            onClick={() => request.id && handleStatusUpdate(request.id, 'Rejected')}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {request.employeeId === profile.uid && request.status === 'Approved' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 text-muted-foreground hover:text-white"
                          onClick={() => {
                            reminderService.addReminder({
                              userId: profile.uid,
                              type: 'leave',
                              relatedId: request.id!,
                              reminderTime: new Date(new Date(request.startDate).getTime() - 24 * 60 * 60 * 1000).toISOString(),
                              message: `Reminder: Your leave starts tomorrow (${format(parseISO(request.startDate), 'MMM dd')}).`,
                              read: false
                            });
                            toast.success('Reminder set for 1 day before leave starts.');
                          }}
                        >
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Remind Me
                        </Button>
                      )}

                      {request.status !== 'Pending' && ! (request.employeeId === profile.uid && request.status === 'Approved') && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold border-border/50">
                          {request.status}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
          </DialogHeader>
          <LeaveRequestForm 
            profile={profile}
            onSuccess={() => setIsAddDialogOpen(false)}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
