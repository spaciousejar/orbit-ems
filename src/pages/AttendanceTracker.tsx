import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  LogIn,
  LogOut,
  History,
  Timer,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Attendance, UserProfile } from '../types';
import { attendanceService } from '../services/attendanceService';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Props {
  profile: UserProfile;
}

export const AttendanceTracker: React.FC<Props> = ({ profile }) => {
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [exportStartDate, setExportStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
  const [exportEndDate, setExportEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const empId = profile.employeeId || profile.uid;
    if (!empId) return;

    const unsubscribe = attendanceService.subscribeToAttendance(empId, (records) => {
      setHistory(records);
      const today = new Date().toISOString().split('T')[0];
      const todayRec = records.find(r => r.date === today);
      setTodayRecord(todayRec || null);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile.employeeId, profile.uid]);

  const handleClockIn = async () => {
    const empId = profile.employeeId || profile.uid;
    if (!empId) return;
    try {
      await attendanceService.clockIn(empId, profile.name || profile.displayName || profile.email || 'Unknown User');
      toast.success('Clocked in successfully');
    } catch (error) {
      toast.error('Failed to clock in');
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord?.id) return;
    try {
      await attendanceService.clockOut(todayRecord.id);
      toast.success('Clocked out successfully');
    } catch (error) {
      toast.error('Failed to clock out');
    }
  };

  const getStatusBadge = (status: Attendance['status']) => {
    switch (status) {
      case 'Present': return <Badge className="bg-emerald-500/10 text-brand-emerald border-emerald-500/20">Present</Badge>;
      case 'Late': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Late</Badge>;
      case 'Absent': return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Absent</Badge>;
      case 'Half Day': return <Badge className="bg-primary/10 text-primary border-primary/20">Half Day</Badge>;
      default: return null;
    }
  };

  const calculateDuration = (inTime: string, outTime?: string) => {
    if (!outTime) return '-';
    const mins = differenceInMinutes(parseISO(outTime), parseISO(inTime));
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleExportCSV = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setIsExporting(true);
    try {
      const empId = profile.employeeId || profile.uid;
      const records = await attendanceService.getAttendanceForPeriod(
        exportStartDate, 
        exportEndDate, 
        profile.role === 'admin' || profile.role === 'hr_manager' ? undefined : empId
      );

      if (!records || records.length === 0) {
        toast.error('No records found for the selected period');
        return;
      }

      const headers = ['User Name', 'User ID', 'Date', 'Status', 'Clock In', 'Clock Out', 'Duration'];
      const rows = records.map(r => [
        r.employeeName,
        r.employeeId,
        r.date,
        r.status,
        r.clockIn ? format(parseISO(r.clockIn), 'HH:mm:ss') : '',
        r.clockOut ? format(parseISO(r.clockOut), 'HH:mm:ss') : '',
        calculateDuration(r.clockIn, r.clockOut)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_report_${exportStartDate}_to_${exportEndDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Status Card */}
        <Card className="md:col-span-2 bg-muted border-border backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">Attendance Tracker</CardTitle>
                <CardDescription className="text-muted-foreground">Track your daily work hours and status</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-primary">
                  {format(currentTime, 'HH:mm:ss')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(currentTime, 'EEEE, MMMM do')}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-muted rounded-2xl border border-border">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    todayRecord ? "bg-emerald-500/20 text-brand-emerald" : "bg-card text-muted-foreground"
                  )}>
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Current Status</div>
                    <div className="text-xl font-bold text-foreground">
                      {todayRecord ? (todayRecord.clockOut ? 'Shift Completed' : 'Currently Working') : 'Not Clocked In'}
                    </div>
                  </div>
                </div>

                {todayRecord && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase font-bold">Clock In</div>
                      <div className="text-lg font-mono text-foreground">{format(parseISO(todayRecord.clockIn), 'HH:mm:ss')}</div>
                    </div>
                    {todayRecord.clockOut && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase font-bold">Clock Out</div>
                        <div className="text-lg font-mono text-foreground">{format(parseISO(todayRecord.clockOut), 'HH:mm:ss')}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 w-full md:w-48">
                {!todayRecord ? (
                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-16 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                    onClick={handleClockIn}
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Clock In
                  </Button>
                ) : !todayRecord.clockOut ? (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white h-16 text-lg font-bold rounded-xl"
                    onClick={handleClockOut}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Clock Out
                  </Button>
                ) : (
                  <div className="flex flex-col items-center justify-center h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-brand-emerald">
                    <CheckCircle2 className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold uppercase">Done for today</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="bg-muted border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-xl border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">This Month</span>
                <Timer className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">164h 20m</div>
              <div className="text-xs text-brand-emerald mt-1">+12% from last month</div>
            </div>
            <div className="p-4 bg-muted rounded-xl border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Late Arrivals</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">2</div>
              <div className="text-xs text-muted-foreground mt-1">Keep it up!</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="bg-muted border-border backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">Attendance History</CardTitle>
            <CardDescription className="text-muted-foreground">Your recent clock-in and clock-out records</CardDescription>
          </div>
          
          {(profile.role === 'admin' || profile.role === 'hr_manager') && (
            <div className="flex flex-wrap items-end gap-3 p-3 bg-muted rounded-xl border border-border">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground font-bold">Start Date</Label>
                <Input 
                  type="date" 
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  className="h-8 bg-card border-border text-xs w-32"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-muted-foreground font-bold">End Date</Label>
                <Input 
                  type="date" 
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  className="h-8 bg-card border-border text-xs w-32"
                />
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={handleExportCSV}
                disabled={isExporting}
              >
                {isExporting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                ) : (
                  <Download className="w-3 h-3 mr-2" />
                )}
                Export CSV
              </Button>
            </div>
          )}
          
          <div className="hidden md:block">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Clock In</TableHead>
                <TableHead className="text-muted-foreground">Clock Out</TableHead>
                <TableHead className="text-muted-foreground">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {history.map((record) => (
                  <motion.tr 
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border-border hover:bg-accent transition-colors group"
                  >
                    <TableCell className="font-medium text-foreground">
                      {format(parseISO(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {format(parseISO(record.clockIn), 'HH:mm:ss')}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {record.clockOut ? format(parseISO(record.clockOut), 'HH:mm:ss') : '--:--:--'}
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {calculateDuration(record.clockIn, record.clockOut)}
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No attendance records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
