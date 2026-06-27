import { cn, getInitials as getInitialsUtil } from "@/lib/utils";
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Briefcase,
  MoreHorizontal,
  ChevronRight,
  CheckSquare,
  AlertCircle,
  User as UserIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UserRole, Holiday, User, LeaveRequest, Task, UserProfile } from "../types";
import { holidayService } from "../services/holidayService";
import { userService } from "../services/userService";
import { leaveService } from "../services/leaveService";
import { taskService } from "../services/taskService";
import { auth } from "../firebase";
import { useState, useEffect, useMemo } from "react";
import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, subMonths } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';

const parseDateValue = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && typeof val.toDate === 'function') return val.toDate();
  if (typeof val === 'number') return new Date(val);
  const d = parseISO(String(val));
  return isNaN(d.getTime()) ? null : d;
};

const cleanField = (val: any, fallback: string = ""): string => {
  if (val === undefined || val === null) return fallback;
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "") return fallback;
  return str;
};

interface DashboardOverviewProps {
  profile: UserProfile;
}

export function DashboardOverview({ profile }: DashboardOverviewProps) {
  const userRole = profile.role;
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dateRange, setDateRange] = useState("30"); // days
  
  const canManage = userRole === 'admin' || userRole === 'hr_manager';

  useEffect(() => {
      const unsubHolidays = holidayService.subscribeToHolidays(null, setHolidays);
    const unsubEmployees = userService.subscribeToUsers(setEmployees);
    const unsubLeaves = leaveService.subscribeToLeaveRequests(setLeaveRequests);
    const unsubTasks = taskService.subscribeToTasks(profile.employeeId || profile.uid, setTasks);
    
    return () => {
      unsubHolidays();
      unsubEmployees();
      unsubLeaves();
      unsubTasks();
    };
  }, [userRole, profile.uid, profile.employeeId]);

  const filteredEmployees = useMemo(() => {
    const cutoff = subDays(new Date(), parseInt(dateRange));
    return employees.filter(e => {
      if (!e.createdAt) return true;
      try {
        const dateObj = parseISO(e.createdAt);
        if (isNaN(dateObj.getTime())) return true;
        return dateObj >= cutoff;
      } catch (err) {
        return true;
      }
    });
  }, [employees, dateRange]);

  const headcountData = useMemo(() => {
    const days = parseInt(dateRange);
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const count = employees.filter(e => {
        if (!e.createdAt) return true;
        try {
          const dateObj = parseISO(e.createdAt);
          if (isNaN(dateObj.getTime())) return true;
          return dateObj <= date;
        } catch (err) {
          return true;
        }
      }).length;
      data.push({
        date: format(date, 'MMM dd'),
        count
      });
    }
    return data;
  }, [employees, dateRange]);

  const departmentData = useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach(e => {
      const dept = cleanField(e.department, 'Unassigned');
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [employees]);

  const employeePhotoMap = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    employees.forEach(e => {
      if (e.id) map[e.id] = e.photoURL;
      if (e.uid) map[e.uid] = e.photoURL;
    });
    return map;
  }, [employees]);

  const leavePatternData = useMemo(() => {
    const counts: Record<string, number> = {};
    const days = parseInt(dateRange);
    const cutoff = subDays(new Date(), days);
    
    leaveRequests.forEach(r => {
      try {
        const dateObj = parseDateValue(r.createdAt);
        if (!dateObj) return;
        if (dateObj >= cutoff) {
          const dateStr = format(dateObj, 'MMM dd');
          counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
      } catch (e) {
        // Ignore invalid dates
      }
    });
      
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        try {
          // parse the 'MMM dd' format back to a date for sorting
          // We can just use the current year for sorting purposes
          const currentYear = new Date().getFullYear();
          const dateA = new Date(`${a.date} ${currentYear}`).getTime();
          const dateB = new Date(`${b.date} ${currentYear}`).getTime();
          return dateA - dateB;
        } catch (e) {
          return 0;
        }
      });
  }, [leaveRequests, dateRange]);

  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

  const upcomingHolidays = holidays
    .filter(h => parseISO(h.date) >= new Date())
    .slice(0, 3);

  const onLeaveTodayCount = useMemo(() => {
    const today = startOfDay(new Date());
    return leaveRequests.filter(r => {
      if (r.status !== 'Approved') return false;
      try {
        const start = startOfDay(parseISO(r.startDate));
        const end = endOfDay(parseISO(r.endDate));
        return isWithinInterval(today, { start, end });
      } catch (e) {
        return false;
      }
    }).length;
  }, [leaveRequests]);

  const pendingLeaveCount = useMemo(() => {
    return leaveRequests.filter(r => r.status === 'Pending').length;
  }, [leaveRequests]);

  const stats = [
    {
      title: "Total Employees",
      value: employees.length.toLocaleString(),
      change: `+${employees.filter(e => e.createdAt && parseISO(e.createdAt) >= subMonths(new Date(), 1)).length} this month`,
      icon: Users,
      iconColor: "text-muted-foreground",
      visible: true,
    },
    {
      title: "Active Now",
      value: employees.filter(e => e.status === 'Active').length.toLocaleString(),
      change: `${Math.round((employees.filter(e => e.status === 'Active').length / (employees.length || 1)) * 100)}% active rate`,
      icon: UserCheck,
      iconColor: "text-brand-emerald",
      visible: true,
    },
    {
      title: "On Leave today",
      value: onLeaveTodayCount.toLocaleString(),
      change: `${pendingLeaveCount} pending requests`,
      icon: UserMinus,
      iconColor: "text-warning",
      visible: canManage,
    },
    {
      title: "Open Positions",
      value: "12",
      change: "3 new this week",
      icon: Briefcase,
      iconColor: "text-primary",
      visible: canManage,
    },
    {
      title: "Pending Tasks",
      value: tasks.filter(t => t.status !== 'Completed').length.toLocaleString(),
      change: `${tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length} high priority`,
      icon: CheckSquare,
      iconColor: "text-primary",
      visible: true,
    },
  ];

  const visibleStats = stats.filter(s => s.visible);

  const displayLeaveRequests = leaveRequests.slice(0, 5);

  const newHires = [...employees]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 4)
    .map(e => {
      const firstName = cleanField(e.firstName);
      const lastName = cleanField(e.lastName);
      let fullName = `${firstName} ${lastName}`.trim();
      
      if (!fullName) {
        fullName = cleanField(e.name) || cleanField(e.displayName) || cleanField(e.email) || 'Team Member';
      }
      
      return {
        name: fullName,
        role: cleanField(e.jobTitle, 'Team Member'),
        date: e.createdAt ? `Joined ${format(parseISO(e.createdAt), 'MMM dd')}` : 'Recently joined',
        initials: getInitialsUtil(fullName) || 'TM',
        photoURL: e.photoURL,
        color: "bg-primary/20 text-primary",
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Analytics Overview</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Range:</span>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v ?? '')}>
            <SelectTrigger className="w-[140px] bg-background border-border text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border-border text-foreground">
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="365">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleStats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("w-4 h-4", stat.iconColor)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount Trend */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Headcount Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={headcountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={Math.max(1, Math.floor(parseInt(dateRange) / 6))}
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--chart-1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--chart-1)" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Department Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4 flex flex-col justify-center">
            {departmentData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground mb-2 stroke-[1.5]" />
                <p className="text-xs text-muted-foreground">No department data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-[10px] text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Leave Patterns */}
        <Card className="lg:col-span-2 bg-card border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Leave Request Patterns</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={leavePatternData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={Math.max(1, Math.floor(parseInt(dateRange) / 6))}
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--chart-2)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="var(--chart-2)" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Leave Requests */}
        <Card className="lg:col-span-2 bg-card border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Recent Leave Requests
            </CardTitle>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayLeaveRequests.map((request, i) => (
                    <tr key={i} className="group hover:bg-muted/50 transition-colors">
                      <td className="py-4 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={employeePhotoMap[request.employeeId]} alt={request.employeeName} />
                            <AvatarFallback className="bg-muted text-muted-foreground border border-border text-[10px] font-bold">
                              {getInitialsUtil(request.employeeName) || <UserIcon className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <span>{request.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-4 text-muted-foreground">{request.type}</td>
                      <td className="py-4 text-muted-foreground">{format(parseISO(request.startDate), 'MMM dd')} - {format(parseISO(request.endDate), 'MMM dd')}</td>
                      <td className="py-4">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full border-none",
                            request.status === "Approved" 
                              ? "bg-brand-emerald/10 text-brand-emerald" 
                              : request.status === "Rejected"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-warning/10 text-warning"
                          )}
                        >
                          {request.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {displayLeaveRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">No recent leave requests.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* New Hires */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">
              New Hires (This Month)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {newHires.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserIcon className="h-8 w-8 text-muted-foreground mb-2 stroke-[1.5]" />
                <p className="text-xs text-muted-foreground">No new hires this month.</p>
              </div>
            ) : (
              newHires.map((hire, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={hire.photoURL} alt={hire.name} />
                      <AvatarFallback className={cn("text-xs font-bold", hire.color)}>
                        {hire.initials || <UserIcon className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {hire.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{hire.role}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{hire.date}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              Upcoming Holidays
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-none">
              {upcomingHolidays.length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingHolidays.map((holiday, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">{format(parseISO(holiday.date), 'MMM')}</span>
                  <span className="text-sm text-foreground font-bold leading-none">{format(parseISO(holiday.date), 'dd')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {holiday.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{format(parseISO(holiday.date), 'EEEE')}</p>
                </div>
              </div>
            ))}
            {upcomingHolidays.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No upcoming holidays.
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">
              My Pending Tasks
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-none">
              {tasks.filter(t => t.status !== 'Completed').length}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.filter(t => t.status !== 'Completed').slice(0, 4).map((task, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className={cn(
                  "w-2 h-10 rounded-full shrink-0",
                  task.priority === 'High' ? "bg-destructive" : task.priority === 'Medium' ? "bg-warning" : "bg-brand-emerald"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-muted-foreground">Due {format(parseISO(task.dueDate), 'MMM dd')}</p>
                    <Badge variant="outline" className="text-[8px] h-3 px-1 border-border text-muted-foreground uppercase">
                      {task.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {tasks.filter(t => t.status !== 'Completed').length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No pending tasks.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
