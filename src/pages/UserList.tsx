import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, User, Eye, Search, Filter, ShieldAlert } from 'lucide-react';
import { User as UserType, UserRole, LeaveRequest } from '../types';
import { userService } from '../services/userService';
import { leaveService } from '../services/leaveService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserForm } from '../components/forms/UserForm';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getInitials as getInitialsUtil } from '@/lib/utils';
import { useDebounce } from '../hooks/useDebounce';
import { parseISO, differenceInDays } from 'date-fns';

const DEPARTMENTS = ['All', 'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Legal'];

interface UserListProps {
  userRole: UserRole;
  initialSearchQuery?: string;
  initialDepartment?: string;
  onClearFilters?: () => void;
}

function getUserName(user: UserType): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.displayName) {
    return user.displayName;
  }
  return user.name || '';
}

function getUserRole(user: UserType): string {
  return user.jobTitle || user.role || '';
}

export function UserList({ userRole, initialSearchQuery, initialDepartment, onClearFilters }: UserListProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [viewingUser, setViewingUser] = useState<UserType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedDept, setSelectedDept] = useState(initialDepartment || 'All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialDepartment !== undefined) {
      setSelectedDept(initialDepartment);
    }
  }, [initialDepartment]);

  const canManage = userRole === 'admin' || userRole === 'hr_manager';

  useEffect(() => {
    const unsubscribeUsers = userService.subscribeToUsers(setUsers);
    const unsubscribeLeaves = leaveService.subscribeToLeaveRequests(setLeaveRequests);
    return () => {
      unsubscribeUsers();
      unsubscribeLeaves();
    };
  }, []);

  useEffect(() => {
    let filtered = users;
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        return (
          fullName.includes(query) ||
          (u.firstName?.toLowerCase() || '').includes(query) || 
          (u.lastName?.toLowerCase() || '').includes(query) ||
          (u.email?.toLowerCase() || '').includes(query) ||
          (u.jobTitle?.toLowerCase() || '').includes(query)
        );
      });
    }
    if (selectedDept !== 'All') {
      filtered = filtered.filter(u => u.department === selectedDept);
    }
    setFilteredUsers(filtered);
  }, [users, debouncedSearchQuery, selectedDept]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedDept]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    if (!canManage) {
      toast.error('Only admins and HR managers can delete users');
      return;
    }
    try {
      await userService.deleteUser(id);
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-brand-emerald border-emerald-500/20';
      case 'Inactive':
        return 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20';
      case 'On Leave':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20';
    }
  };

  const getUserLeaveStats = (userId: string) => {
    const userRequests = leaveRequests.filter(r => r.employeeId === userId);
    
    let totalDays = 0;
    let approvedDays = 0;
    let pendingCount = 0;

    userRequests.forEach(r => {
      try {
        if (!r.startDate || !r.endDate) return;
        
        const start = parseISO(r.startDate);
        const end = parseISO(r.endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
        
        const days = Math.max(0, differenceInDays(end, start) + 1);

        totalDays += days;
        if (r.status === 'Approved') {
          approvedDays += days;
        } else if (r.status === 'Pending') {
          pendingCount++;
        }
      } catch (e) {
        console.error("Error parsing dates for leave request", r);
      }
    });

    return { totalDays, approvedDays, pendingCount };
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-9 bg-muted border-border text-foreground focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedDept} onValueChange={(v) => setSelectedDept(v ?? '')}>
              <SelectTrigger className="bg-muted border-border text-foreground focus:ring-primary">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept} value={dept} className="hover:bg-accent cursor-pointer">{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-none">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium h-12">Name</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12">Role</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12">Department</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12">Leave Summary</TableHead>
                <TableHead className="text-muted-foreground font-medium h-12">Email</TableHead>
                <TableHead className="text-right text-muted-foreground font-medium h-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow className="border-border hover:bg-accent">
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-accent transition-colors group">
                    <TableCell className="font-medium text-foreground">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group/name"
                        onClick={() => {
                          setViewingUser(user);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover/name:bg-primary/20 transition-colors overflow-hidden">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={getUserName(user)} 
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[10px] font-bold">
                              {getInitialsUtil(getUserName(user)) || <User className="h-4 w-4" />}
                            </span>
                          )}
                        </div>
                        <span className="group-hover/name:text-primary transition-colors underline-offset-4 group-hover/name:underline">
                          {getUserName(user)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{getUserRole(user)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-normal">
                        {user.department || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-normal", getStatusBadge(user.status || 'Active'))}>
                        {user.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.id && (
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const stats = getUserLeaveStats(user.id);
                            return (
                              <>
                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 px-1.5 py-0">
                                  Total: {stats.totalDays}d
                                </Badge>
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-brand-emerald border-emerald-500/20 px-1.5 py-0">
                                  Appr: {stats.approvedDays}d
                                </Badge>
                                {stats.pendingCount > 0 && (
                                  <Badge variant="outline" className="text-[10px] bg-amber-500/5 text-amber-500 border-amber-500/20 px-1.5 py-0">
                                    Pend: {stats.pendingCount}
                                  </Badge>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent")}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border text-muted-foreground">
                          <DropdownMenuItem className="hover:bg-accent hover:text-foreground cursor-pointer" onClick={() => {
                            setViewingUser(user);
                            setIsViewDialogOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canManage && (
                            <>
                              <DropdownMenuItem className="hover:bg-accent hover:text-foreground cursor-pointer" onClick={() => {
                                setEditingUser(user);
                                setIsEditDialogOpen(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-400 hover:bg-red-400/10 hover:text-red-400 cursor-pointer"
                                onClick={() => user.id && setUserToDelete(user.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="border-border text-muted-foreground hover:bg-accent"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="border-border text-muted-foreground hover:bg-accent"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog 
        open={isViewDialogOpen && !!viewingUser} 
        onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) setViewingUser(null);
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground p-0 overflow-hidden">
          {viewingUser && (
            <>
              <DialogHeader className="sr-only">
                <DialogTitle>{getUserName(viewingUser)}</DialogTitle>
                <DialogDescription>User details</DialogDescription>
              </DialogHeader>
              <div className="h-32 bg-gradient-to-r from-primary/20 to-purple-600/20 relative">
                <div className="absolute -bottom-12 left-8">
                  <div className="h-24 w-24 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-primary shadow-xl overflow-hidden">
                    {viewingUser?.photoURL ? (
                      <img 
                        src={viewingUser.photoURL} 
                        alt={getUserName(viewingUser)} 
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-2xl font-bold">
                        {getInitialsUtil(getUserName(viewingUser)) || <User className="h-10 w-10" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-16 pb-8 px-8 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                      {getUserName(viewingUser)}
                    </h3>
                    <p className="text-muted-foreground font-medium">{getUserRole(viewingUser)}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-normal">
                        {viewingUser.department || '—'}
                      </Badge>
                      <Badge className={cn("font-normal border-none", getStatusBadge(viewingUser.status || 'Active'))}>
                        {viewingUser.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {canManage && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          setEditingUser(viewingUser);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-sm">{viewingUser.email}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-sm">{viewingUser.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Member Since</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-sm">
                        {viewingUser.createdAt 
                          ? new Date(viewingUser.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Last Activity</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-sm">
                        {viewingUser.updatedAt
                          ? new Date(viewingUser.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Leave Summary</p>
                  <div className="grid grid-cols-3 gap-4">
                    {(() => {
                      const stats = getUserLeaveStats(viewingUser.id || '');
                      return (
                        <>
                          <div className="bg-muted rounded-xl p-3 border border-border">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Total Requested</p>
                            <p className="text-xl font-bold text-primary">{stats.totalDays} <span className="text-xs font-normal text-muted-foreground">days</span></p>
                          </div>
                          <div className="bg-muted rounded-xl p-3 border border-border">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Approved</p>
                            <p className="text-xl font-bold text-brand-emerald">{stats.approvedDays} <span className="text-xs font-normal text-muted-foreground">days</span></p>
                          </div>
                          <div className="bg-muted rounded-xl p-3 border border-border">
                            <p className="text-[10px] text-muted-foreground font-medium mb-1">Pending Requests</p>
                            <p className="text-xl font-bold text-amber-500">{stats.pendingCount}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex justify-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsViewDialogOpen(false)}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    Close Profile
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setEditingUser(null);
      }}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="sr-only">Edit user details</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm 
              user={editingUser} 
              onSuccess={() => setIsEditDialogOpen(false)}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete the user
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-accent">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => userToDelete && handleDelete(userToDelete)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
