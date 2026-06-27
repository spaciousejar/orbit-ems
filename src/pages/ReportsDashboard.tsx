import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Search, 
  ChevronRight, 
  Calendar, 
  Users, 
  Clock, 
  CreditCard,
  ArrowRight,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { userService } from '../services/userService';
import { attendanceService } from '../services/attendanceService';
import { leaveService } from '../services/leaveService';
import { User, Attendance, LeaveRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

type ReportType = 'employees' | 'attendance' | 'leaves' | 'payroll';

export function ReportsDashboard() {
  const [activeReport, setActiveReport] = useState<ReportType>('employees');
  const [employees, setEmployees] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const unsubEmployees = userService.subscribeToUsers(setEmployees);
      const unsubAttendance = attendanceService.subscribeToAttendance(null, setAttendance);
      const unsubLeaves = leaveService.subscribeToLeaveRequests(setLeaves);
      setLoading(false);
      return () => {
        unsubEmployees();
        unsubAttendance();
        unsubLeaves();
      };
    };
    fetchData();
  }, []);

  const handleExport = (type: ReportType) => {
    const data = filteredData();
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    toast.success(`Preparing ${type} report...`);

    let csvContent = "";
    const headers = [];

    if (type === 'employees') {
      headers.push("First Name", "Last Name", "Email", "Department", "Job Title", "Status");
      csvContent += headers.join(",") + "\n";
      data.forEach((item: any) => {
        csvContent += `"${item.firstName}","${item.lastName}","${item.email}","${item.department}","${item.jobTitle}","${item.status}"\n`;
      });
    } else if (type === 'attendance') {
      headers.push("Employee", "Date", "Clock In", "Status");
      csvContent += headers.join(",") + "\n";
      data.forEach((item: any) => {
        csvContent += `"${item.employeeName}","${item.date}","${item.clockIn ? new Date(item.clockIn).toLocaleTimeString() : '-'}","${item.status}"\n`;
      });
    } else if (type === 'leaves') {
      headers.push("Employee", "Type", "Start Date", "End Date", "Status");
      csvContent += headers.join(",") + "\n";
      data.forEach((item: any) => {
        csvContent += `"${item.employeeName}","${item.type}","${item.startDate}","${item.endDate}","${item.status}"\n`;
      });
    } else if (type === 'payroll') {
      headers.push("Employee", "Base Salary", "Allowances", "Deductions", "Net Pay");
      csvContent += headers.join(",") + "\n";
      data.forEach((item: any) => {
        csvContent += `"${item.name}","${item.baseSalary}","${item.allowances}","${item.deductions}","${item.netPay}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orbit_report_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      toast.success(`${type} report downloaded successfully.`);
    }, 500);
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    switch (activeReport) {
      case 'employees':
        return employees.filter(e => 
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(term) || 
          e.department?.toLowerCase().includes(term) ||
          e.jobTitle?.toLowerCase().includes(term)
        );
      case 'attendance':
        return attendance.filter(a => 
          a.employeeName.toLowerCase().includes(term) || 
          a.date.includes(term) ||
          a.status.toLowerCase().includes(term)
        );
      case 'leaves':
        return leaves.filter(l => 
          l.employeeName.toLowerCase().includes(term) || 
          l.type.toLowerCase().includes(term) ||
          l.status.toLowerCase().includes(term)
        );
      case 'payroll':
        // Simulated payroll data based on employees
        return employees.map(e => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          department: e.department,
          baseSalary: 5000 + (Math.random() * 5000),
          allowances: 500 + (Math.random() * 1000),
          deductions: 200 + (Math.random() * 500),
          netPay: 0 // calculated below
        })).map(p => ({ ...p, netPay: p.baseSalary + p.allowances - p.deductions }))
        .filter(p => p.name.toLowerCase().includes(term) || p.department?.toLowerCase().includes(term));
      default:
        return [];
    }
  };

  const reportConfigs = [
    { id: 'employees', label: 'Team Directory', icon: Users, description: 'Complete list of all active and inactive users.' },
    { id: 'attendance', label: 'Attendance Summary', icon: Clock, description: 'Daily clock-in/out records and punctuality stats.' },
    { id: 'leaves', label: 'Leave Utilization', icon: Calendar, description: 'Breakdown of leave requests and balances.' },
    { id: 'payroll', label: 'Payroll Summary', icon: CreditCard, description: 'Monthly salary, allowances, and deductions report.' },
  ];

  const handlePrint = () => {
    toast.info("Preparing print view...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6 report-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm">Generate and export detailed organizational reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => handleExport(activeReport)}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-2 no-print">
          {reportConfigs.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id as ReportType)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                activeReport === report.id 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "hover:bg-accent text-muted-foreground border border-transparent"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg transition-colors",
                activeReport === report.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground group-hover:text-foreground"
              )}>
                <report.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{report.label}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{report.description}</p>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                activeReport === report.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:opacity-50"
              )} />
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-4 print:col-span-4">
          <Card className="bg-card border-border overflow-hidden print:bg-white print:text-black">
            <CardHeader className="border-b border-border pb-4 no-print">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg text-foreground">
                    {reportConfigs.find(r => r.id === activeReport)?.label}
                  </CardTitle>
                  <CardDescription>
                    Showing {filteredData().length} records
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Filter records..." 
                    className="pl-9 bg-muted border-border text-foreground h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <div className="hidden print:block p-6 border-b border-zinc-200">
              <h2 className="text-2xl font-bold">{reportConfigs.find(r => r.id === activeReport)?.label}</h2>
              <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Records: {filteredData().length}</p>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeReport}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Table className="print:text-black">
                      <TableHeader className="bg-muted print:bg-zinc-100">
                        <TableRow className="border-border hover:bg-transparent print:border-zinc-200">
                          {activeReport === 'employees' && (
                            <>
                              <TableHead className="text-muted-foreground print:text-black">Name</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Department</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Job Title</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Status</TableHead>
                            </>
                          )}
                          {activeReport === 'attendance' && (
                            <>
                              <TableHead className="text-muted-foreground print:text-black">Employee</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Date</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Clock In</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Status</TableHead>
                            </>
                          )}
                          {activeReport === 'leaves' && (
                            <>
                              <TableHead className="text-muted-foreground print:text-black">Employee</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Type</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Period</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Status</TableHead>
                            </>
                          )}
                          {activeReport === 'payroll' && (
                            <>
                              <TableHead className="text-muted-foreground print:text-black">Employee</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Base Salary</TableHead>
                              <TableHead className="text-muted-foreground print:text-black">Allowances</TableHead>
                              <TableHead className="text-muted-foreground text-right print:text-black">Net Pay</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData().map((item: any, idx: number) => (
                          <TableRow key={item.id || idx} className="border-border hover:bg-accent print:border-zinc-200">
                            {activeReport === 'employees' && (
                              <>
                                <TableCell className="font-medium text-foreground print:text-black">{item.firstName} {item.lastName}</TableCell>
                                <TableCell className="text-muted-foreground print:text-black">{item.department}</TableCell>
                                <TableCell className="text-muted-foreground print:text-black">{item.jobTitle}</TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    item.status === 'Active' ? "bg-green-500/10 text-green-500" : "bg-muted-foreground/10 text-muted-foreground",
                                    "print:border print:border-zinc-200 print:text-black"
                                  )}>
                                    {item.status}
                                  </span>
                                </TableCell>
                              </>
                            )}
                            {activeReport === 'attendance' && (
                              <>
                                <TableCell className="font-medium text-foreground print:text-black">{item.employeeName}</TableCell>
                                <TableCell className="text-muted-foreground print:text-black">{item.date}</TableCell>
                                <TableCell className="text-muted-foreground print:text-black">{item.clockIn ? new Date(item.clockIn).toLocaleTimeString() : '-'}</TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    item.status === 'Present' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500",
                                    "print:border print:border-zinc-200 print:text-black"
                                  )}>
                                    {item.status}
                                  </span>
                                </TableCell>
                              </>
                            )}
                            {activeReport === 'leaves' && (
                              <>
                                <TableCell className="font-medium text-foreground print:text-black">{item.employeeName}</TableCell>
                                <TableCell className="text-muted-foreground print:text-black">{item.type}</TableCell>
                                <TableCell className="text-muted-foreground text-xs print:text-black">{item.startDate} to {item.endDate}</TableCell>
                                <TableCell>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    item.status === 'Approved' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500",
                                    "print:border print:border-zinc-200 print:text-black"
                                  )}>
                                    {item.status}
                                  </span>
                                </TableCell>
                              </>
                            )}
                            {activeReport === 'payroll' && (
                              <>
                                <TableCell className="font-medium text-foreground print:text-black">{item.name}</TableCell>
                                <TableCell className="text-muted-foreground print:text-black">${item.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-muted-foreground print:text-black">${item.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right text-green-500 font-bold print:text-black">
                                  ${item.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
