import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { userService } from '../services/userService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { checklistService } from '../services/checklistService';
import { User, Attendance, LeaveRequest, OnboardingProcess, OffboardingProcess } from '../types';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  UserPlus, 
  UserMinus,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COLORS = ['var(--chart-1)', 'var(--chart-4)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-6)'];

const cleanField = (val: any, fallback: string = ""): string => {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "") return fallback;
  return str;
};

const formatDateLabel = (isoStr: string) => {
  try {
    const [y, m, d] = isoStr.split('-');
    if (!y || !m || !d) return isoStr;
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return isoStr;
  }
};

export function AnalyticsDashboard() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [onboarding, setOnboarding] = useState<OnboardingProcess[]>([]);
  const [offboarding, setOffboarding] = useState<OffboardingProcess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const unsubEmployees = userService.subscribeToUsers(setEmployees);
      const unsubAttendance = attendanceService.subscribeToAttendance(null, setAttendance);
      const unsubLeaves = leaveService.subscribeToLeaveRequests(setLeaves);
      const unsubOnboarding = checklistService.subscribeToOnboarding(setOnboarding);
      const unsubOffboarding = checklistService.subscribeToOffboarding(setOffboarding);

      setLoading(false);

      return () => {
        unsubEmployees();
        unsubAttendance();
        unsubLeaves();
        unsubOnboarding();
        unsubOffboarding();
      };
    };

    fetchData();
  }, []);

  // Data Processing
  const deptData = employees.reduce((acc: any[], emp) => {
    const dept = cleanField(emp.department, 'Unassigned');
    const existing = acc.find(d => d.name === dept);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: dept, count: 1 });
    }
    return acc;
  }, []);

  const leaveTypeData = leaves.reduce((acc: any[], leave) => {
    const type = leave.type;
    const existing = acc.find(d => d.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, []);

  // Simulated trend data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const attendanceTrend = last7Days.map(date => {
    const present = attendance.filter(a => a.date === date && a.status === 'Present').length;
    const late = attendance.filter(a => a.date === date && a.status === 'Late').length;
    return { date, present, late };
  });

  const growthTrend = last7Days.map(date => {
    const joined = onboarding.filter(o => o.startDate === date).length;
    const left = offboarding.filter(o => o.lastWorkingDay === date).length;
    return { date, joined, left };
  });

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;

  const handlePrint = () => {
    toast.info("Preparing print view...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6 report-container">
      {/* Printable Report Header */}
      <div className="hidden print:block p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">Organization Analytics Report</h1>
        <p className="text-muted-foreground text-sm">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-sm">Real-time insights into your organization's workforce.</p>
        </div>
        <div>
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Today Present', value: attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Present').length, icon: Activity, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Active Onboarding', value: onboarding.filter(o => o.status === 'In Progress').length, icon: UserPlus, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Pending Leaves', value: leaves.filter(l => l.status === 'Pending').length, icon: Calendar, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Headcount by Department
            </CardTitle>
            <CardDescription>Distribution of employees across various departments.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Attendance Trend
            </CardTitle>
            <CardDescription>Daily attendance and punctuality over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={formatDateLabel}
                  dy={8}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="present" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="late" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-chart-5" />
              Leave Type Distribution
            </CardTitle>
            <CardDescription>Breakdown of leave requests by category.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={leaveTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {leaveTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Trend */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-destructive" />
              Hiring vs Attrition
            </CardTitle>
            <CardDescription>New joiners vs departing employees trend.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={growthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={formatDateLabel}
                  dy={8}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="joined" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.1} />
                <Area type="monotone" dataKey="left" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
